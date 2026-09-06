import * as THREE from 'three';
import { TrackDefinition } from '../types';

export const TRACK_DEFINITIONS: TrackDefinition[] = [
  {
    id: 'sunny_beach',
    name: 'Päikeserand (Sunny Beach Island)',
    theme: 'beach',
    difficulty: 'Easy',
    description: 'Troopiline saarerada looklevate palmide, liivaluidete, puusildade ja rannavarjudega!',
    lengthMeters: 620,
    lapsDefault: 3,
    skyColor: 0x7dd3fc,
    fogColor: 0xbae6fd,
    groundColor: 0xfde047,
    trackColor: 0x334155,
    curbColorA: 0xef4444,
    curbColorB: 0xf8fafc,
    points: [
      [0, 0, 0],
      [40, 1, 80],
      [90, 2, 140],
      [160, 1, 160],
      [220, 3, 110],
      [230, 4, 30],
      [190, 2, -50],
      [130, 1, -110],
      [50, 2, -130],
      [-30, 3, -110],
      [-100, 2, -60],
      [-140, 1, 10],
      [-120, 1, 80],
      [-60, 0, 40],
    ],
  },
  {
    id: 'spooky_castle',
    name: 'Kummitusloss (Spooky Graveyard)',
    theme: 'spooky',
    difficulty: 'Medium',
    description: 'Öine munakivirada läbi kummitusliku kalmistu, vanade lossimüüride ja hõõguvate kõrvitsate!',
    lengthMeters: 740,
    lapsDefault: 3,
    skyColor: 0x0f172a,
    fogColor: 0x1e1b4b,
    groundColor: 0x1f2937,
    trackColor: 0x27272a,
    curbColorA: 0x8b5cf6,
    curbColorB: 0x22c55e,
    points: [
      [0, 0, 0],
      [50, 0, 90],
      [120, 3, 130],
      [190, 6, 100],
      [210, 8, 20],
      [170, 5, -60],
      [110, 2, -100],
      [140, 4, -170],
      [80, 2, -220],
      [-20, 1, -210],
      [-80, 4, -150],
      [-140, 6, -80],
      [-160, 4, 20],
      [-110, 1, 100],
      [-40, 0, 60],
    ],
  },
  {
    id: 'cyber_canyon',
    name: 'Küberkanjon (Neon Cyber Canyon)',
    theme: 'cyber',
    difficulty: 'Hard',
    description: 'Futuristlik neoonrada kiirenduspatjade, teravate kurvide ja pulseerivate küberpüramiididega!',
    lengthMeters: 850,
    lapsDefault: 3,
    skyColor: 0x09090b,
    fogColor: 0x18181b,
    groundColor: 0x020617,
    trackColor: 0x0f172a,
    curbColorA: 0x06b6d4,
    curbColorB: 0xf43f5e,
    points: [
      [0, 0, 0],
      [60, 2, 70],
      [80, 4, 150],
      [150, 7, 200],
      [220, 5, 170],
      [250, 3, 70],
      [210, 5, -20],
      [240, 7, -110],
      [190, 8, -190],
      [100, 4, -220],
      [10, 2, -180],
      [-60, 5, -130],
      [-130, 8, -170],
      [-190, 6, -110],
      [-170, 3, -20],
      [-110, 1, 60],
      [-50, 0, 30],
    ],
  },
  {
    id: 'frozen_peak',
    name: 'Lumine Mäetipp (Frozen Peak)',
    theme: 'ice',
    difficulty: 'Medium',
    description: 'Lumme mattunud mäerada lumememmede, härmas kuuskede, libedamate kurvide ja hiilgavate jääkristallidega!',
    lengthMeters: 790,
    lapsDefault: 3,
    skyColor: 0xdbeafe,
    fogColor: 0xeff6ff,
    groundColor: 0xf1f5f9,
    trackColor: 0x64748b,
    curbColorA: 0x38bdf8,
    curbColorB: 0xffffff,
    points: [
      [0, 0, 0],
      [45, 2, 75],
      [110, 5, 120],
      [180, 8, 90],
      [220, 6, 20],
      [190, 4, -50],
      [140, 7, -120],
      [80, 5, -180],
      [-10, 3, -200],
      [-90, 6, -170],
      [-150, 8, -100],
      [-180, 5, -20],
      [-150, 3, 50],
      [-80, 1, 80],
      [-30, 0, 40],
    ],
  },
];

export interface ItemBoxPosition {
  x: number;
  y: number;
  z: number;
  mesh: THREE.Group;
  active: boolean;
  respawnTime: number;
}

export interface BoostPadPosition {
  x: number;
  y: number;
  z: number;
  rotY: number;
}

export interface TrackData {
  curve: THREE.CatmullRomCurve3;
  trackWidth: number;
  checkpoints: THREE.Vector3[];
  itemBoxes: ItemBoxPosition[];
  boostPads: BoostPadPosition[];
  decorations: THREE.Group;
  trackMesh: THREE.Mesh;
  curbsMesh: THREE.Mesh;
  wallsMesh: THREE.Group;
  startArch: THREE.Group;
  theme: TrackDefinition['theme'];
}

/**
 * Builds the complete 3D racing track including road ribbon, curbs, guardrails, checkpoints, and themed props
 */
export function buildTrack(trackDef: TrackDefinition): TrackData {
  const vectors = trackDef.points.map(p => new THREE.Vector3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(vectors, true, 'centripetal', 0.5);

  const trackWidth = 14;
  const segments = 220;
  const roadPoints: THREE.Vector3[] = curve.getSpacedPoints(segments);

  // 1. Generate Road Ribbon Geometry
  const roadGeo = new THREE.BufferGeometry();
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  const curbVerticesA: number[] = [];
  const curbIndicesA: number[] = [];
  const curbVerticesB: number[] = [];
  const curbIndicesB: number[] = [];

  const wallsGroup = new THREE.Group();

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const pt = curve.getPointAt(t % 1);
    const tangent = curve.getTangentAt(t % 1);
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(tangent, up).normalize();

    const halfW = trackWidth * 0.5;

    // Road left and right points
    const leftPt = pt.clone().add(right.clone().multiplyScalar(-halfW));
    const rightPt = pt.clone().add(right.clone().multiplyScalar(halfW));

    vertices.push(leftPt.x, leftPt.y + 0.05, leftPt.z);
    vertices.push(rightPt.x, rightPt.y + 0.05, rightPt.z);

    uvs.push(0, i * 0.2);
    uvs.push(1, i * 0.2);

    if (i < segments) {
      const idx = i * 2;
      indices.push(idx, idx + 1, idx + 2);
      indices.push(idx + 1, idx + 3, idx + 2);
    }

    // Curbs on left and right edge
    const curbW = 1.2;
    const curbLeftOuter = leftPt.clone().add(right.clone().multiplyScalar(-curbW));
    const curbRightOuter = rightPt.clone().add(right.clone().multiplyScalar(curbW));

    // Left curb
    const cLIdx = i * 2;
    curbVerticesA.push(curbLeftOuter.x, curbLeftOuter.y + 0.12, curbLeftOuter.z);
    curbVerticesA.push(leftPt.x, leftPt.y + 0.08, leftPt.z);

    // Right curb
    curbVerticesB.push(rightPt.x, rightPt.y + 0.08, rightPt.z);
    curbVerticesB.push(curbRightOuter.x, curbRightOuter.y + 0.12, curbRightOuter.z);

    if (i < segments) {
      curbIndicesA.push(cLIdx, cLIdx + 1, cLIdx + 2);
      curbIndicesA.push(cLIdx + 1, cLIdx + 3, cLIdx + 2);

      curbIndicesB.push(cLIdx, cLIdx + 1, cLIdx + 2);
      curbIndicesB.push(cLIdx + 1, cLIdx + 3, cLIdx + 2);
    }
  }

  roadGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  roadGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  roadGeo.setIndex(indices);
  roadGeo.computeVertexNormals();

  const roadMat = new THREE.MeshStandardMaterial({
    color: trackDef.trackColor,
    roughness: 0.8,
  });
  const trackMesh = new THREE.Mesh(roadGeo, roadMat);
  trackMesh.receiveShadow = true;

  // Curbs mesh (striped red/white or theme colors)
  const curbGeoA = new THREE.BufferGeometry();
  curbGeoA.setAttribute('position', new THREE.Float32BufferAttribute(curbVerticesA, 3));
  curbGeoA.setIndex(curbIndicesA);
  curbGeoA.computeVertexNormals();

  const curbGeoB = new THREE.BufferGeometry();
  curbGeoB.setAttribute('position', new THREE.Float32BufferAttribute(curbVerticesB, 3));
  curbGeoB.setIndex(curbIndicesB);
  curbGeoB.computeVertexNormals();

  const curbMatA = new THREE.MeshStandardMaterial({
    color: trackDef.curbColorA,
    roughness: 0.5,
  });
  const curbMeshA = new THREE.Mesh(curbGeoA, curbMatA);
  const curbMatB = new THREE.MeshStandardMaterial({
    color: trackDef.curbColorB,
    roughness: 0.5,
  });
  const curbMeshB = new THREE.Mesh(curbGeoB, curbMatB);

  const curbsGroup = new THREE.Group();
  curbsGroup.add(curbMeshA);
  curbsGroup.add(curbMeshB);

  // 2. Checkpoints along spline for lap progress & AI navigation
  const numCheckpoints = 28;
  const checkpoints: THREE.Vector3[] = [];
  for (let i = 0; i < numCheckpoints; i++) {
    const pt = curve.getPointAt(i / numCheckpoints);
    checkpoints.push(pt);
  }

  // 3. Start / Finish Line Arch
  const startArch = new THREE.Group();
  const startPt = curve.getPointAt(0);
  const startTangent = curve.getTangentAt(0);
  const startRight = new THREE.Vector3().crossVectors(startTangent, new THREE.Vector3(0, 1, 0)).normalize();

  startArch.position.copy(startPt);
  const angle = Math.atan2(startTangent.x, startTangent.z);
  startArch.rotation.y = angle;

  // Arch pillars
  const pillarGeo = new THREE.CylinderGeometry(0.5, 0.6, 7, 12);
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x3b82f6, metalness: 0.2, roughness: 0.3 });
  const pL = new THREE.Mesh(pillarGeo, pillarMat);
  pL.position.set(-trackWidth * 0.55, 3.5, 0);
  startArch.add(pL);
  const pR = new THREE.Mesh(pillarGeo, pillarMat);
  pR.position.set(trackWidth * 0.55, 3.5, 0);
  startArch.add(pR);

  // Cross beam
  const beamGeo = new THREE.BoxGeometry(trackWidth * 1.25, 1.4, 0.8);
  const beamMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.4 });
  const beam = new THREE.Mesh(beamGeo, beamMat);
  beam.position.set(0, 6.8, 0);
  startArch.add(beam);

  // Checkered banner on beam
  const bannerGeo = new THREE.BoxGeometry(trackWidth * 1.1, 0.8, 0.85);
  const bannerMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
  });
  const banner = new THREE.Mesh(bannerGeo, bannerMat);
  banner.position.set(0, 6.8, 0);
  startArch.add(banner);

  // Checkered line on the road
  const startLineGeo = new THREE.PlaneGeometry(trackWidth, 2.5);
  startLineGeo.rotateX(-Math.PI / 2);
  const startLineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const startLine = new THREE.Mesh(startLineGeo, startLineMat);
  startLine.position.set(0, 0.08, 0);
  startArch.add(startLine);

  // 4. Mystery Item Boxes
  const itemBoxes: ItemBoxPosition[] = [];
  const itemBoxStations = [0.12, 0.35, 0.60, 0.82]; // 4 item box zones around track

  itemBoxStations.forEach(t => {
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();

    // 3 boxes spread across track width
    const offsets = [-4.5, 0, 4.5];
    offsets.forEach(off => {
      const boxPos = pt.clone().add(right.clone().multiplyScalar(off));
      boxPos.y += 1.2;

      const boxGroup = new THREE.Group();
      boxGroup.position.copy(boxPos);

      // Glowing translucent outer cube
      const cubeGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
      const cubeMat = new THREE.MeshStandardMaterial({
        color: 0xfacc15,
        emissive: 0xf59e0b,
        emissiveIntensity: 0.8,
        transparent: true,
        opacity: 0.85,
        roughness: 0.1,
      });
      const cubeMesh = new THREE.Mesh(cubeGeo, cubeMat);
      boxGroup.add(cubeMesh);

      // Inner question mark cylinder / accent
      const qGeo = new THREE.OctahedronGeometry(0.45);
      const qMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const qMesh = new THREE.Mesh(qGeo, qMat);
      boxGroup.add(qMesh);

      itemBoxes.push({
        x: boxPos.x,
        y: boxPos.y,
        z: boxPos.z,
        mesh: boxGroup,
        active: true,
        respawnTime: 0,
      });
    });
  });

  // 5. Speed Boost Pads on Track
  const boostPads: BoostPadPosition[] = [];
  const boostStations = [0.22, 0.48, 0.74];
  boostStations.forEach(t => {
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const rotY = Math.atan2(tangent.x, tangent.z);

    boostPads.push({
      x: pt.x,
      y: pt.y + 0.1,
      z: pt.z,
      rotY,
    });
  });

  // 6. Themed Scenery Props
  const decorations = new THREE.Group();

  if (trackDef.theme === 'beach') {
    // Palm trees, beach umbrellas, lighthouse
    for (let i = 0; i < 40; i++) {
      const t = (i / 40 + Math.random() * 0.02) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const dist = (Math.random() > 0.5 ? 1 : -1) * (trackWidth * 0.75 + 4 + Math.random() * 25);

      const treePos = pt.clone().add(right.multiplyScalar(dist));
      treePos.y = 0;

      // Cartoon Palm Tree
      const tree = new THREE.Group();
      tree.position.copy(treePos);

      const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.3, 0.5, 6, 8),
        new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 })
      );
      trunk.position.y = 3;
      trunk.rotation.z = (Math.random() - 0.5) * 0.2;
      tree.add(trunk);

      // Leaves
      const leafMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.6 });
      for (let l = 0; l < 5; l++) {
        const leaf = new THREE.Mesh(new THREE.ConeGeometry(1.8, 1, 4), leafMat);
        leaf.position.set(0, 6, 0);
        leaf.rotation.y = (l / 5) * Math.PI * 2;
        leaf.rotation.z = 0.5;
        tree.add(leaf);
      }
      decorations.add(tree);
    }
  } else if (trackDef.theme === 'spooky') {
    // Castle pillars, crooked dead trees, glowing green torches, pumpkins
    for (let i = 0; i < 35; i++) {
      const t = (i / 35) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const dist = (i % 2 === 0 ? 1 : -1) * (trackWidth * 0.7 + 5 + Math.random() * 20);

      const propPos = pt.clone().add(right.multiplyScalar(dist));
      propPos.y = pt.y;

      const propGroup = new THREE.Group();
      propGroup.position.copy(propPos);

      if (i % 3 === 0) {
        // Glowing pumpkin
        const pumpkin = new THREE.Mesh(
          new THREE.SphereGeometry(1.2, 12, 12),
          new THREE.MeshStandardMaterial({ color: 0xea580c, emissive: 0xc2410c, emissiveIntensity: 0.6 })
        );
        pumpkin.scale.set(1.2, 0.9, 1.2);
        pumpkin.position.y = 0.9;
        propGroup.add(pumpkin);
      } else {
        // Tombstone or stone pillar
        const stone = new THREE.Mesh(
          new THREE.BoxGeometry(1.5, 3.5, 1.5),
          new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.9 })
        );
        stone.position.y = 1.75;
        stone.rotation.y = Math.random();
        propGroup.add(stone);
      }
      decorations.add(propGroup);
    }
  } else if (trackDef.theme === 'cyber') {
    // Cyber Canyon: Neon pyramids, cyber towers, glowing arches
    for (let i = 0; i < 30; i++) {
      const t = (i / 30) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const dist = (i % 2 === 0 ? 1 : -1) * (trackWidth * 0.75 + 8 + Math.random() * 25);

      const towerPos = pt.clone().add(right.multiplyScalar(dist));
      towerPos.y = pt.y;

      const tower = new THREE.Group();
      tower.position.copy(towerPos);

      const pyramid = new THREE.Mesh(
        new THREE.ConeGeometry(3, 10, 4),
        new THREE.MeshStandardMaterial({
          color: 0x0f172a,
          emissive: i % 2 === 0 ? 0x06b6d4 : 0xf43f5e,
          emissiveIntensity: 0.6,
          wireframe: true,
        })
      );
      pyramid.position.y = 5;
      tower.add(pyramid);
      decorations.add(tower);
    }
  } else {
    // Frozen Peak (Ice theme): Snowmen, snowy pine trees, and glowing ice crystals
    for (let i = 0; i < 36; i++) {
      const t = (i / 36) % 1;
      const pt = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
      const dist = (i % 2 === 0 ? 1 : -1) * (trackWidth * 0.75 + 6 + Math.random() * 22);

      const propPos = pt.clone().add(right.multiplyScalar(dist));
      propPos.y = pt.y;

      const propGroup = new THREE.Group();
      propGroup.position.copy(propPos);

      if (i % 4 === 0) {
        // Cute Cartoon Snowman
        const snowman = new THREE.Group();
        const snowMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 });
        
        // Base sphere
        const base = new THREE.Mesh(new THREE.SphereGeometry(1.2, 10, 10), snowMat);
        base.position.y = 1.0;
        snowman.add(base);

        // Middle sphere
        const mid = new THREE.Mesh(new THREE.SphereGeometry(0.85, 10, 10), snowMat);
        mid.position.y = 2.4;
        snowman.add(mid);

        // Head sphere
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.55, 10, 10), snowMat);
        head.position.y = 3.4;
        snowman.add(head);

        // Carrot nose
        const carrot = new THREE.Mesh(
          new THREE.ConeGeometry(0.12, 0.5, 6),
          new THREE.MeshStandardMaterial({ color: 0xf97316 })
        );
        carrot.position.set(0, 3.4, 0.55);
        carrot.rotation.x = Math.PI / 2;
        snowman.add(carrot);

        // Top hat
        const hat = new THREE.Mesh(
          new THREE.CylinderGeometry(0.35, 0.45, 0.6, 8),
          new THREE.MeshStandardMaterial({ color: 0x1e293b })
        );
        hat.position.y = 4.0;
        snowman.add(hat);

        propGroup.add(snowman);
      } else if (i % 4 === 1 || i % 4 === 2) {
        // Snowy Pine Tree (3 tiered cones with snow trim)
        const pine = new THREE.Group();
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.25, 0.35, 2, 6),
          new THREE.MeshStandardMaterial({ color: 0x78350f })
        );
        trunk.position.y = 1;
        pine.add(trunk);

        const treeMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.7 });
        const snowCapMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.5 });

        for (let tier = 0; tier < 3; tier++) {
          const cone = new THREE.Mesh(new THREE.ConeGeometry(2.2 - tier * 0.5, 2, 6), treeMat);
          cone.position.y = 2.5 + tier * 1.4;
          pine.add(cone);

          // Snow cap on cone
          const snowCap = new THREE.Mesh(new THREE.ConeGeometry(1.6 - tier * 0.4, 0.6, 6), snowCapMat);
          snowCap.position.y = 3.3 + tier * 1.4;
          pine.add(snowCap);
        }
        propGroup.add(pine);
      } else {
        // Glowing Cyan Ice Crystals
        const crystalMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.5,
          roughness: 0.2,
          metalness: 0.3,
          transparent: true,
          opacity: 0.88,
        });

        for (let c = 0; c < 3; c++) {
          const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.0 - c * 0.2, 0), crystalMat);
          crystal.scale.set(0.6, 2.5, 0.6);
          crystal.position.set((c - 1) * 0.7, 1.2, (Math.random() - 0.5) * 0.5);
          crystal.rotation.set((c - 1) * 0.2, c * 0.8, 0);
          propGroup.add(crystal);
        }
      }

      decorations.add(propGroup);
    }
  }

  // Guard rails / walls for physics collisions
  for (let i = 0; i < segments; i += 4) {
    const t = i / segments;
    const pt = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t);
    const right = new THREE.Vector3().crossVectors(tangent, new THREE.Vector3(0, 1, 0)).normalize();
    const rotY = Math.atan2(tangent.x, tangent.z);

    const railGeo = new THREE.BoxGeometry(0.3, 0.9, 4);
    const railMat = new THREE.MeshStandardMaterial({
      color: trackDef.theme === 'cyber' ? 0x06b6d4 : (trackDef.theme === 'ice' ? 0x38bdf8 : 0xe2e8f0),
      metalness: 0.5,
      roughness: 0.3,
    });

    const leftWall = new THREE.Mesh(railGeo, railMat);
    leftWall.position.copy(pt).add(right.clone().multiplyScalar(-trackWidth * 0.52));
    leftWall.position.y += 0.45;
    leftWall.rotation.y = rotY;
    wallsGroup.add(leftWall);

    const rightWall = new THREE.Mesh(railGeo, railMat);
    rightWall.position.copy(pt).add(right.clone().multiplyScalar(trackWidth * 0.52));
    rightWall.position.y += 0.45;
    rightWall.rotation.y = rotY;
    wallsGroup.add(rightWall);
  }

  return {
    curve,
    trackWidth,
    checkpoints,
    itemBoxes,
    boostPads,
    decorations,
    trackMesh,
    curbsMesh: curbsGroup as any,
    wallsMesh: wallsGroup,
    startArch,
    theme: trackDef.theme,
  };
}
