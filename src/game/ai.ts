import * as THREE from 'three';
import { RacerState, PlayerInput } from '../types';
import { TrackData } from './tracks';

const AI_TAUNTS = [
  "Söö mu tolmu! 💨",
  "Vaata ja õpi! 😎",
  "Puhas kiirus! ⚡",
  "Ei saa kätte! 😜",
  "Võta see! 🚀",
  "Hoia alt! 💥",
  "Ops, vabandust! 😈",
];

const AI_OUCHES = [
  "Ai kurja! 😵",
  "Kes selle siia pani?! 💣",
  "Küll ma sulle veel näitan! 😡",
  "Mu ilus värv! 💥",
  "Pöörab pea ringi! 💫",
];

export interface AIOpponentController {
  racerId: string;
  laneOffset: number; // -4 to 4 across track
  aggression: number;
  itemCooldown: number;
  tauntCooldown: number;
}

export function createAIControllers(racers: RacerState[]): Map<string, AIOpponentController> {
  const map = new Map<string, AIOpponentController>();
  racers.forEach((r, idx) => {
    if (r.isAI) {
      map.set(r.id, {
        racerId: r.id,
        laneOffset: ((idx % 3) - 1) * 3.2,
        aggression: 0.6 + Math.random() * 0.4,
        itemCooldown: 1.0 + Math.random() * 2.0,
        tauntCooldown: 5 + Math.random() * 8,
      });
    }
  });
  return map;
}

/**
 * Calculates AI inputs (throttle, steer, drift, useItem)
 */
export function computeAIInput(
  racer: RacerState,
  aiCtrl: AIOpponentController,
  track: TrackData,
  allRacers: RacerState[],
  dt: number,
  onUseItem?: (racerId: string) => void
): PlayerInput {
  aiCtrl.itemCooldown -= dt;
  aiCtrl.tauntCooldown -= dt;

  // 1. Lookahead target along track checkpoints
  const numCp = track.checkpoints.length;
  // Look 2 checkpoints ahead
  const targetCpIdx = (racer.checkpointIndex + 2) % numCp;
  const targetCp = track.checkpoints[targetCpIdx].clone();

  // Apply lane offset
  const prevCp = track.checkpoints[(targetCpIdx - 1 + numCp) % numCp];
  const tangent = new THREE.Vector3().subVectors(targetCp, prevCp).normalize();
  const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
  targetCp.add(right.multiplyScalar(aiCtrl.laneOffset));

  // 2. Compute steering angle
  const carPos = new THREE.Vector3(racer.x, 0, racer.z);
  const toTarget = new THREE.Vector3().subVectors(targetCp, carPos);
  const targetAngle = Math.atan2(toTarget.x, toTarget.z);

  let angleDiff = targetAngle - racer.rotY;
  // Normalize angle to -PI to +PI
  while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
  while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

  // Steering: clamp between -1 and 1
  const steer = THREE.MathUtils.clamp(angleDiff * 2.5, -1, 1);

  // 3. Drift on sharp turns
  const isSharpTurn = Math.abs(angleDiff) > 0.45 && racer.speed > 25;
  const drift = isSharpTurn && Math.random() < 0.8;

  // 4. Throttle & Brake
  let throttle = 1.0;
  let brake = 0.0;

  if (Math.abs(angleDiff) > 0.85 && racer.speed > 35) {
    // Too fast into a hairpin corner
    brake = 0.5;
    throttle = 0.3;
  }

  // 5. Intelligent Item Usage
  let useItem = false;
  if (racer.currentItem && aiCtrl.itemCooldown <= 0) {
    const item = racer.currentItem;

    if (item === 'rocket' || item === 'trio_rockets') {
      // Check if another racer is in front within firing distance
      const rivalAhead = allRacers.find(other => {
        if (other.id === racer.id) return false;
        const dx = other.x - racer.x;
        const dz = other.z - racer.z;
        const dist = Math.hypot(dx, dz);
        if (dist > 8 && dist < 65) {
          const angleToRival = Math.atan2(dx, dz);
          let diff = Math.abs(angleToRival - racer.rotY);
          while (diff > Math.PI) diff = Math.PI * 2 - diff;
          return diff < 0.6; // In front cone
        }
        return false;
      });

      if (rivalAhead) {
        useItem = true;
        aiCtrl.itemCooldown = 2.5;
        if (Math.random() < 0.6) {
          racer.speechText = "Võta see! 🚀";
          racer.speechTimer = 2.0;
        }
      }
    } else if (item === 'mine') {
      // Drop if someone is close behind
      const rivalBehind = allRacers.find(other => {
        if (other.id === racer.id) return false;
        const dist = Math.hypot(other.x - racer.x, other.z - racer.z);
        return dist < 22;
      });

      if (rivalBehind || Math.random() < 0.4) {
        useItem = true;
        aiCtrl.itemCooldown = 2.0;
        racer.speechText = "Vaata ette! 💣";
        racer.speechTimer = 2.0;
      }
    } else if (item === 'turbo' || item === 'shield' || item === 'repair') {
      // Use turbo or shield almost immediately
      useItem = true;
      aiCtrl.itemCooldown = 1.5;
    } else if (item === 'lightning' || item === 'anvil') {
      // Use offensive specials
      useItem = true;
      aiCtrl.itemCooldown = 2.0;
      racer.speechText = item === 'anvil' ? "Alasi langeb! 🔨" : "Välk teile kõigile! 🌩️";
      racer.speechTimer = 2.5;
    }

    if (useItem && onUseItem) {
      onUseItem(racer.id);
    }
  }

  // 6. Occasional Humorous Taunts
  if (aiCtrl.tauntCooldown <= 0) {
    aiCtrl.tauntCooldown = 10 + Math.random() * 12;
    if (racer.position <= 3 && Math.random() < 0.5) {
      racer.speechText = AI_TAUNTS[Math.floor(Math.random() * AI_TAUNTS.length)];
      racer.speechTimer = 2.5;
    }
  }

  // Hit reaction text
  if (racer.spinTimer > 1.2 && !racer.speechText) {
    racer.speechText = AI_OUCHES[Math.floor(Math.random() * AI_OUCHES.length)];
    racer.speechTimer = 2.0;
  }

  return {
    throttle,
    brake,
    steer,
    drift,
    useItem,
    honk: false,
  };
}
