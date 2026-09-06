import * as THREE from 'three';

export interface Particle {
  mesh: THREE.Mesh;
  vx: number;
  vy: number;
  vz: number;
  rotSpeed: number;
  scaleSpeed: number;
  life: number;
  maxLife: number;
  color: THREE.Color;
}

export class ParticleSystem {
  private scene: THREE.Scene;
  private particles: Particle[] = [];
  
  // Reusable geometries and materials to keep GPU load ultra lightweight
  private sparkGeo: THREE.SphereGeometry;
  private starGeo: THREE.BufferGeometry;
  private smokeGeo: THREE.SphereGeometry;
  private flameGeo: THREE.ConeGeometry;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.sparkGeo = new THREE.SphereGeometry(0.12, 6, 6);
    this.smokeGeo = new THREE.SphereGeometry(0.22, 6, 6);
    this.flameGeo = new THREE.ConeGeometry(0.2, 0.6, 6);
    this.flameGeo.rotateX(Math.PI / 2);

    // Create a 5-pointed cartoon comic star geometry
    const starShape = new THREE.Shape();
    const points = 5;
    const outerR = 0.28;
    const innerR = 0.12;
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (i / (points * 2)) * Math.PI * 2;
      const sx = Math.cos(a) * r;
      const sy = Math.sin(a) * r;
      if (i === 0) starShape.moveTo(sx, sy);
      else starShape.lineTo(sx, sy);
    }
    this.starGeo = new THREE.ShapeGeometry(starShape);
  }

  /**
   * Spawns exhaust smoke puff
   */
  public emitExhaustSmoke(x: number, y: number, z: number, carRotY: number) {
    if (this.particles.length > 300) return;
    const mat = new THREE.MeshBasicMaterial({
      color: 0xcccccc,
      transparent: true,
      opacity: 0.55,
    });
    const mesh = new THREE.Mesh(this.smokeGeo, mat);
    mesh.position.set(
      x + (Math.random() - 0.5) * 0.1,
      y + (Math.random() - 0.5) * 0.05,
      z + (Math.random() - 0.5) * 0.1
    );

    const fwdX = Math.sin(carRotY);
    const fwdZ = Math.cos(carRotY);

    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vx: -fwdX * 1.5 + (Math.random() - 0.5) * 0.8,
      vy: 0.6 + Math.random() * 0.5,
      vz: -fwdZ * 1.5 + (Math.random() - 0.5) * 0.8,
      rotSpeed: (Math.random() - 0.5) * 2,
      scaleSpeed: 1.6,
      life: 0.45 + Math.random() * 0.25,
      maxLife: 0.7,
      color: new THREE.Color(0xcccccc),
    });
  }

  /**
   * Spawns nitro boost flame jet
   */
  public emitNitroFlame(x: number, y: number, z: number, carRotY: number) {
    if (this.particles.length > 300) return;
    const isCyan = Math.random() > 0.4;
    const flameColor = isCyan ? 0x06b6d4 : 0xf97316;
    const mat = new THREE.MeshBasicMaterial({
      color: flameColor,
      transparent: true,
      opacity: 0.85,
    });
    const mesh = new THREE.Mesh(this.flameGeo, mat);
    mesh.position.set(x, y, z);
    mesh.rotation.y = carRotY;

    const fwdX = Math.sin(carRotY);
    const fwdZ = Math.cos(carRotY);

    this.scene.add(mesh);
    this.particles.push({
      mesh,
      vx: -fwdX * 7 + (Math.random() - 0.5) * 0.8,
      vy: (Math.random() - 0.5) * 0.4,
      vz: -fwdZ * 7 + (Math.random() - 0.5) * 0.8,
      rotSpeed: 0,
      scaleSpeed: 0.8,
      life: 0.2,
      maxLife: 0.2,
      color: new THREE.Color(flameColor),
    });
  }

  /**
   * Spawns drift sparks (yellow or super-blue)
   */
  public emitDriftSparks(x: number, y: number, z: number, level: 1 | 2) {
    if (this.particles.length > 300) return;
    const count = 2;
    for (let i = 0; i < count; i++) {
      const color = level === 1 ? (Math.random() > 0.5 ? 0xfacc15 : 0xf97316) : 0x38bdf8;
      const mat = new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity: 0.9,
      });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(
        x + (Math.random() - 0.5) * 0.2,
        y + 0.1,
        z + (Math.random() - 0.5) * 0.2
      );

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: (Math.random() - 0.5) * 4,
        vy: 1.5 + Math.random() * 2.5,
        vz: (Math.random() - 0.5) * 4,
        rotSpeed: (Math.random() - 0.5) * 6,
        scaleSpeed: -0.6,
        life: 0.35,
        maxLife: 0.35,
        color: new THREE.Color(color),
      });
    }
  }

  /**
   * Spawns bump / collision sparks
   */
  public emitSparks(x: number, y: number, z: number, colorHex: number = 0xffd700, count: number = 8) {
    for (let i = 0; i < count; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.sparkGeo, mat);
      mesh.position.set(x, y, z);
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 5;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 1.5 + Math.random() * 3,
        vz: Math.sin(angle) * speed,
        rotSpeed: 0,
        scaleSpeed: -0.5,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        color: new THREE.Color(colorHex),
      });
    }
  }

  /**
   * Spawns explosion burst of comic stars & smoke clouds
   */
  public emitExplosion(x: number, y: number, z: number) {
    // Stars
    for (let i = 0; i < 16; i++) {
      const colors = [0xfacc15, 0xef4444, 0xf97316, 0xffffff];
      const color = colors[i % colors.length];
      const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 1,
      });
      const mesh = new THREE.Mesh(this.starGeo, mat);
      mesh.position.set(x, y + 0.5, z);

      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 7 + Math.random() * 8;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 3 + Math.random() * 6,
        vz: Math.sin(angle) * speed,
        rotSpeed: (Math.random() - 0.5) * 12,
        scaleSpeed: -0.8,
        life: 0.65 + Math.random() * 0.3,
        maxLife: 0.95,
        color: new THREE.Color(color),
      });
    }

    // Smoke puffs
    for (let i = 0; i < 8; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: 0x334155,
        transparent: true,
        opacity: 0.7,
      });
      const mesh = new THREE.Mesh(this.smokeGeo, mat);
      mesh.position.set(x, y + 0.3, z);
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 3;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(angle) * speed,
        vy: 2 + Math.random() * 3,
        vz: Math.sin(angle) * speed,
        rotSpeed: (Math.random() - 0.5) * 3,
        scaleSpeed: 2.2,
        life: 0.8,
        maxLife: 0.8,
        color: new THREE.Color(0x334155),
      });
    }
  }

  /**
   * Spawns item box pickup sparkles
   */
  public emitBoxBreak(x: number, y: number, z: number) {
    for (let i = 0; i < 14; i++) {
      const colors = [0xfacc15, 0xfde047, 0x38bdf8, 0xffffff];
      const color = colors[i % colors.length];
      const mat = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95,
      });
      const mesh = new THREE.Mesh(this.starGeo, mat);
      mesh.position.set(x, y, z);

      const a = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 6;

      this.scene.add(mesh);
      this.particles.push({
        mesh,
        vx: Math.cos(a) * speed,
        vy: 2 + Math.random() * 4,
        vz: Math.sin(a) * speed,
        rotSpeed: (Math.random() - 0.5) * 8,
        scaleSpeed: -0.7,
        life: 0.5,
        maxLife: 0.5,
        color: new THREE.Color(color),
      });
    }
  }

  /**
   * Updates all active particles
   */
  public update(dt: number) {
    const alive: Particle[] = [];

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.scene.remove(p.mesh);
        (p.mesh.material as THREE.Material).dispose();
      } else {
        // Move
        p.mesh.position.x += p.vx * dt;
        p.mesh.position.y += p.vy * dt;
        p.mesh.position.z += p.vz * dt;

        // Apply slight gravity
        p.vy -= 9.8 * dt * 0.6;

        // Rotate
        p.mesh.rotation.y += p.rotSpeed * dt;
        p.mesh.rotation.z += p.rotSpeed * dt;

        // Scale & Opacity
        const lifeRatio = p.life / p.maxLife;
        const currentScale = Math.max(0.01, 1 + (1 - lifeRatio) * p.scaleSpeed);
        p.mesh.scale.set(currentScale, currentScale, currentScale);

        const mat = p.mesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.max(0, lifeRatio * 0.9);

        alive.push(p);
      }
    }

    this.particles = alive;
  }

  public clear() {
    this.particles.forEach(p => {
      this.scene.remove(p.mesh);
      (p.mesh.material as THREE.Material).dispose();
    });
    this.particles = [];
  }
}
