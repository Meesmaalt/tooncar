import * as THREE from 'three';

interface SkidPoint {
  left: THREE.Vector3;
  right: THREE.Vector3;
  opacity: number;
}

interface SkidStrip {
  points: SkidPoint[];
  mesh: THREE.Mesh;
  geo: THREE.BufferGeometry;
  mat: THREE.MeshBasicMaterial;
  lastPosLeft: THREE.Vector3 | null;
  lastPosRight: THREE.Vector3 | null;
}

export class SkidMarkManager {
  private scene: THREE.Scene;
  private strips: Map<string, SkidStrip> = new Map();
  private maxPointsPerStrip = 80;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Records skid marks for a racer's rear tires
   */
  public addSkid(racerId: string, carX: number, carY: number, carZ: number, carRotY: number, opacity: number = 0.6) {
    // Left and right rear wheel offsets
    const fwd = new THREE.Vector3(Math.sin(carRotY), 0, Math.cos(carRotY));
    const right = new THREE.Vector3(fwd.z, 0, -fwd.x);

    const rearOffset = fwd.clone().multiplyScalar(-0.85);
    const halfTrack = 0.75;
    const wheelWidth = 0.22;

    const leftWheelCenter = new THREE.Vector3(carX, carY + 0.08, carZ)
      .add(rearOffset)
      .add(right.clone().multiplyScalar(-halfTrack));

    const rightWheelCenter = new THREE.Vector3(carX, carY + 0.08, carZ)
      .add(rearOffset)
      .add(right.clone().multiplyScalar(halfTrack));

    // Left mark edges
    const p1 = leftWheelCenter.clone().add(right.clone().multiplyScalar(-wheelWidth * 0.5));
    const p2 = leftWheelCenter.clone().add(right.clone().multiplyScalar(wheelWidth * 0.5));

    // Right mark edges
    const p3 = rightWheelCenter.clone().add(right.clone().multiplyScalar(-wheelWidth * 0.5));
    const p4 = rightWheelCenter.clone().add(right.clone().multiplyScalar(wheelWidth * 0.5));

    this.appendSkidQuad(`${racerId}_left`, p1, p2, opacity);
    this.appendSkidQuad(`${racerId}_right`, p3, p4, opacity);
  }

  /**
   * Ends current continuous skid mark (e.g. drift stopped) so it doesn't bridge across the track
   */
  public stopSkid(racerId: string) {
    const sL = this.strips.get(`${racerId}_left`);
    if (sL) {
      sL.lastPosLeft = null;
      sL.lastPosRight = null;
    }
    const sR = this.strips.get(`${racerId}_right`);
    if (sR) {
      sR.lastPosLeft = null;
      sR.lastPosRight = null;
    }
  }

  private appendSkidQuad(key: string, ptLeft: THREE.Vector3, ptRight: THREE.Vector3, opacity: number) {
    let strip = this.strips.get(key);
    if (!strip) {
      const geo = new THREE.BufferGeometry();
      const mat = new THREE.MeshBasicMaterial({
        color: 0x111827,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 1;
      this.scene.add(mesh);

      strip = {
        points: [],
        mesh,
        geo,
        mat,
        lastPosLeft: null,
        lastPosRight: null,
      };
      this.strips.set(key, strip);
    }

    // Only add if moved enough distance
    if (strip.lastPosLeft) {
      const dist = strip.lastPosLeft.distanceTo(ptLeft);
      if (dist < 0.3) return;
    }

    strip.lastPosLeft = ptLeft.clone();
    strip.lastPosRight = ptRight.clone();

    strip.points.push({
      left: ptLeft.clone(),
      right: ptRight.clone(),
      opacity,
    });

    if (strip.points.length > this.maxPointsPerStrip) {
      strip.points.shift();
    }

    this.rebuildGeometry(strip);
  }

  private rebuildGeometry(strip: SkidStrip) {
    if (strip.points.length < 2) return;

    const vertices: number[] = [];
    const indices: number[] = [];

    for (let i = 0; i < strip.points.length; i++) {
      const p = strip.points[i];
      vertices.push(p.left.x, p.left.y, p.left.z);
      vertices.push(p.right.x, p.right.y, p.right.z);

      if (i < strip.points.length - 1) {
        const idx = i * 2;
        indices.push(idx, idx + 1, idx + 2);
        indices.push(idx + 1, idx + 3, idx + 2);
      }
    }

    strip.geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    strip.geo.setIndex(indices);
    strip.geo.computeVertexNormals();
  }

  public update(dt: number) {
    // Fade out old skid marks over time
    this.strips.forEach(strip => {
      if (strip.points.length > 0 && Math.random() < 0.1) {
        strip.points.shift();
        this.rebuildGeometry(strip);
      }
    });
  }

  public clear() {
    this.strips.forEach(strip => {
      this.scene.remove(strip.mesh);
      strip.geo.dispose();
      strip.mat.dispose();
    });
    this.strips.clear();
  }
}
