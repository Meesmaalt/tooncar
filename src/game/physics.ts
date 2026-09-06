import * as THREE from 'three';
import { RacerState, PlayerInput, Projectile, CarDefinition } from '../types';
import { TrackData } from './tracks';
import { CAR_DEFINITIONS } from './cars';
import { soundManager } from '../audio/soundManager';

export interface CollisionEvent {
  type: 'car_bump' | 'wall_hit' | 'item_box' | 'rocket_hit' | 'mine_hit' | 'boost_pad';
  racerId: string;
  targetId?: string;
  x: number;
  y: number;
  z: number;
}

/**
 * Updates physics for a single racer over delta time
 */
export function updateRacerPhysics(
  racer: RacerState,
  input: PlayerInput,
  track: TrackData,
  dt: number,
  onCollision?: (event: CollisionEvent) => void,
  speedFactor: number = 1.0
) {
  const carDef = CAR_DEFINITIONS.find(c => c.id === racer.carId) || CAR_DEFINITIONS[0];
  const isIceTrack = track.theme === 'ice';
  const maxBaseSpeed = (38 + carDef.stats.speed * 1.8) * speedFactor;
  const accelPower = (28 + carDef.stats.accel * 2.2) * speedFactor;
  const handlingPower = (2.2 + carDef.stats.handling * 0.22) * (isIceTrack ? 0.92 : 1.0);

  // Handle respawn / reset
  if (input.respawn) {
    input.respawn = false;
    const cp = track.checkpoints[racer.checkpointIndex];
    const nextCp = track.checkpoints[(racer.checkpointIndex + 1) % track.checkpoints.length];
    const forwardDir = new THREE.Vector3().subVectors(nextCp, cp).normalize();
    racer.x = cp.x;
    racer.y = cp.y + 0.3;
    racer.z = cp.z;
    racer.rotY = Math.atan2(forwardDir.x, forwardDir.z);
    racer.speed = 0;
    racer.spinTimer = 0;
    racer.frozenTimer = 0;
    racer.driftChargeTime = 0;
    soundManager.playRespawn();
    return;
  }

  // Handle spinout (e.g. hit by rocket or mine)
  if (racer.spinTimer > 0) {
    racer.spinTimer -= dt;
    racer.rotY += Math.PI * 6 * dt; // Spin wildly!
    racer.speed = Math.max(0, racer.speed - 35 * dt);

    // Apply motion
    racer.x += Math.sin(racer.rotY) * racer.speed * dt * 0.3;
    racer.z += Math.cos(racer.rotY) * racer.speed * dt * 0.3;
    return;
  }

  // Handle frozen / zap
  if (racer.frozenTimer > 0) {
    racer.frozenTimer -= dt;
  }

  // Handle turbo
  let speedMultiplier = 1.0;
  if (racer.turboTimer > 0) {
    racer.turboTimer -= dt;
    speedMultiplier = 1.65;
  }
  if (racer.frozenTimer > 0) {
    speedMultiplier *= 0.55;
  }

  // Acceleration & Braking
  const topSpeed = maxBaseSpeed * speedMultiplier;
  if (input.throttle > 0) {
    if (racer.speed < topSpeed) {
      racer.speed += accelPower * input.throttle * dt;
    }
  } else if (input.brake > 0) {
    if (racer.speed > -12) {
      racer.speed -= accelPower * 1.3 * input.brake * dt;
    }
  } else {
    // Natural rolling friction & drag (ice is slicker!)
    const dragRate = isIceTrack ? 6.5 : 12;
    if (racer.speed > 0) {
      racer.speed = Math.max(0, racer.speed - dragRate * dt);
    } else if (racer.speed < 0) {
      racer.speed = Math.min(0, racer.speed + dragRate * dt);
    }
  }

  // Drifting mechanic & Mini-turbo charging
  racer.isDrifting = (input.drift || (isIceTrack && Math.abs(input.steer) > 0.88)) && Math.abs(racer.speed) > 10;
  if (racer.isDrifting) {
    racer.driftFactor = Math.min(1.6, racer.driftFactor + dt * (isIceTrack ? 1.8 : 1.5));
    racer.driftChargeTime = (racer.driftChargeTime || 0) + dt;
    // Drift drag
    racer.speed -= (isIceTrack ? 1.8 : 3.5) * dt;
  } else {
    // Check if player just released a charged drift! (Classic Mario Kart style)
    if (racer.driftChargeTime >= 1.0) {
      if (racer.driftChargeTime >= 2.2) {
        // Super Mini-Turbo
        racer.turboTimer = 2.0;
        racer.speed = Math.max(racer.speed + 16, 52);
        soundManager.playTurbo();
      } else {
        // Standard Mini-Turbo
        racer.turboTimer = 1.2;
        racer.speed = Math.max(racer.speed + 10, 46);
        soundManager.playMiniTurbo();
      }
    }
    racer.driftChargeTime = 0;
    racer.driftFactor = Math.max(0, racer.driftFactor - dt * 2.5);
  }

  // Steering
  const steerRate = handlingPower * (racer.isDrifting ? 1.45 : 1.0);
  if (Math.abs(racer.speed) > 0.5) {
    const direction = racer.speed >= 0 ? 1 : -1;
    racer.rotY -= input.steer * steerRate * dt * direction;
    racer.steerAngle = -input.steer * 0.45;
  } else {
    racer.steerAngle = 0;
  }

  // Position forward movement
  const moveSpeed = racer.speed * dt;
  racer.x += Math.sin(racer.rotY) * moveSpeed;
  racer.z += Math.cos(racer.rotY) * moveSpeed;

  // Track height matching & track boundary constraint
  const carPos = new THREE.Vector3(racer.x, 0, racer.z);
  
  // Find closest point on track spline
  let closestDist = Infinity;
  let closestCpIndex = 0;
  for (let i = 0; i < track.checkpoints.length; i++) {
    const cp = track.checkpoints[i];
    const distSq = cp.distanceToSquared(carPos);
    if (distSq < closestDist) {
      closestDist = distSq;
      closestCpIndex = i;
    }
  }

  // Check Wrong-Way orientation against track spline tangent
  const tNorm = closestCpIndex / track.checkpoints.length;
  const trackTangent = track.curve.getTangentAt(tNorm);
  const carFwd = new THREE.Vector3(Math.sin(racer.rotY), 0, Math.cos(racer.rotY));
  const dot = carFwd.dot(trackTangent);
  racer.isWrongWay = dot < -0.35 && racer.speed > 6;

  // Height adherence
  const targetY = track.checkpoints[closestCpIndex].y;
  racer.y = THREE.MathUtils.lerp(racer.y, targetY, dt * 10);

  // Track boundary collision check
  const maxTrackRadius = track.trackWidth * 0.5;
  const distFromTrackCenter = Math.sqrt(closestDist);

  if (distFromTrackCenter > maxTrackRadius + 1.2) {
    // Car collided with outer barrier: bounce back gently & reduce speed
    racer.speed *= 0.65;
    const centerPt = track.checkpoints[closestCpIndex];
    const dirToCenter = new THREE.Vector3().subVectors(centerPt, carPos).normalize();
    
    racer.x += dirToCenter.x * 2.5;
    racer.z += dirToCenter.z * 2.5;

    if (onCollision) {
      onCollision({
        type: 'wall_hit',
        racerId: racer.id,
        x: racer.x,
        y: racer.y,
        z: racer.z,
      });
    }
  }

  // Checkpoint & Lap progression
  const currentExpectedCp = (racer.checkpointIndex + 1) % track.checkpoints.length;
  const distToNextCp = carPos.distanceTo(track.checkpoints[currentExpectedCp]);
  
  if (distToNextCp < 18) {
    racer.checkpointIndex = currentExpectedCp;
    racer.totalDistance += 20;

    // Crossed start/finish line
    if (racer.checkpointIndex === 0) {
      racer.lap += 1;
      const now = Date.now();
      if (racer.currentLapStartTime > 0) {
        const lapDuration = (now - racer.currentLapStartTime) / 1000;
        racer.lapTimes.push(lapDuration);
        if (!racer.bestLapTime || lapDuration < racer.bestLapTime) {
          racer.bestLapTime = lapDuration;
        }
      }
      racer.currentLapStartTime = now;
    }
  }

  // Item box pickups
  track.itemBoxes.forEach(box => {
    if (!box.active) return;
    const boxDist = Math.hypot(racer.x - box.x, racer.z - box.z);
    if (boxDist < 2.5) {
      box.active = false;
      box.respawnTime = 6; // Respawn after 6 seconds
      box.mesh.visible = false;

      if (onCollision) {
        onCollision({
          type: 'item_box',
          racerId: racer.id,
          x: box.x,
          y: box.y,
          z: box.z,
        });
      }
    }
  });

  // Boost pads
  track.boostPads.forEach(pad => {
    const padDist = Math.hypot(racer.x - pad.x, racer.z - pad.z);
    if (padDist < 3.2 && racer.turboTimer <= 0) {
      racer.turboTimer = 2.2;
      racer.speed = Math.max(racer.speed, 50);

      if (onCollision) {
        onCollision({
          type: 'boost_pad',
          racerId: racer.id,
          x: pad.x,
          y: pad.y,
          z: pad.z,
        });
      }
    }
  });

  // Shield timer decay
  if (racer.shieldTimer > 0) {
    racer.shieldTimer -= dt;
    if (racer.shieldTimer <= 0) {
      racer.hasShield = false;
    }
  }

  // Speech bubble decay
  if (racer.speechTimer && racer.speechTimer > 0) {
    racer.speechTimer -= dt;
    if (racer.speechTimer <= 0) {
      racer.speechText = undefined;
    }
  }

  // Animation values
  racer.wheelRot += racer.speed * dt * 2.5;
  racer.bounceOffset = Math.sin(Date.now() * 0.015) * Math.min(0.04, racer.speed * 0.001);
}

/**
 * Handles elastic collision between two cartoon cars (Bumping!)
 */
export function resolveCarCarCollisions(racers: RacerState[], dt: number, onCollision?: (event: CollisionEvent) => void) {
  const carRadius = 1.4;

  for (let i = 0; i < racers.length; i++) {
    for (let j = i + 1; j < racers.length; j++) {
      const a = racers[i];
      const b = racers[j];

      const dx = b.x - a.x;
      const dz = b.z - a.z;
      const dist = Math.hypot(dx, dz);

      if (dist < carRadius * 2 && dist > 0.001) {
        const overlap = (carRadius * 2) - dist;
        const nx = dx / dist;
        const nz = dz / dist;

        // Push cars apart
        a.x -= nx * overlap * 0.5;
        a.z -= nz * overlap * 0.5;
        b.x += nx * overlap * 0.5;
        b.z += nz * overlap * 0.5;

        // Bounce speeds
        const relSpeed = a.speed - b.speed;
        a.speed -= relSpeed * 0.3;
        b.speed += relSpeed * 0.3;

        // Shield ramming bonus!
        if (a.hasShield && !b.hasShield) {
          b.spinTimer = 1.2;
          b.speed *= 0.2;
        } else if (b.hasShield && !a.hasShield) {
          a.spinTimer = 1.2;
          a.speed *= 0.2;
        }

        if (onCollision) {
          onCollision({
            type: 'car_bump',
            racerId: a.id,
            targetId: b.id,
            x: (a.x + b.x) * 0.5,
            y: (a.y + b.y) * 0.5,
            z: (a.z + b.z) * 0.5,
          });
        }
      }
    }
  }
}

/**
 * Updates projectiles (Rockets, Mines)
 */
export function updateProjectiles(
  projectiles: Projectile[],
  racers: RacerState[],
  dt: number,
  onCollision: (event: CollisionEvent) => void
) {
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const p = projectiles[i];
    if (!p.active) continue;

    p.life -= dt;
    if (p.life <= 0) {
      p.active = false;
      continue;
    }

    if (p.type === 'rocket') {
      // Homing / forward motion
      if (p.targetId) {
        const target = racers.find(r => r.id === p.targetId);
        if (target) {
          const dx = target.x - p.x;
          const dz = target.z - p.z;
          const targetDist = Math.hypot(dx, dz);
          if (targetDist > 0.1) {
            const steerX = (dx / targetDist) * 45;
            const steerZ = (dz / targetDist) * 45;
            p.vx = THREE.MathUtils.lerp(p.vx, steerX, dt * 6);
            p.vz = THREE.MathUtils.lerp(p.vz, steerZ, dt * 6);
          }
        }
      }

      p.x += p.vx * dt;
      p.z += p.vz * dt;
      p.y += p.vy * dt;

      // Check collision with cars (except owner during first 0.3s)
      for (const racer of racers) {
        if (racer.id === p.ownerId && p.life > 4.7) continue;

        const dist = Math.hypot(racer.x - p.x, racer.z - p.z);
        if (dist < 2.0) {
          p.active = false;

          // If shielded, absorb hit!
          if (racer.hasShield) {
            racer.hasShield = false;
            racer.shieldTimer = 0;
          } else {
            racer.spinTimer = 1.8;
            racer.speed *= 0.1;
          }

          onCollision({
            type: 'rocket_hit',
            racerId: p.ownerId,
            targetId: racer.id,
            x: p.x,
            y: p.y,
            z: p.z,
          });
          break;
        }
      }
    } else if (p.type === 'mine') {
      // Stationary on track, check if anyone runs over it
      for (const racer of racers) {
        if (racer.id === p.ownerId && p.life > 14.5) continue; // 0.5s grace for owner

        const dist = Math.hypot(racer.x - p.x, racer.z - p.z);
        if (dist < 2.2) {
          p.active = false;

          if (racer.hasShield) {
            racer.hasShield = false;
            racer.shieldTimer = 0;
          } else {
            racer.spinTimer = 2.0;
            racer.speed *= 0.1;
          }

          onCollision({
            type: 'mine_hit',
            racerId: p.ownerId,
            targetId: racer.id,
            x: p.x,
            y: p.y,
            z: p.z,
          });
          break;
        }
      }
    }
  }
}
