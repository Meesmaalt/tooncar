import * as THREE from 'three';
import { CarDefinition, CarCustomization } from '../types';

export const CAR_DEFINITIONS: CarDefinition[] = [
  {
    id: 'speedy_turbo',
    name: 'Speedy Turbo',
    driverName: 'Tommy Rocket',
    driverAvatar: '🚀',
    description: 'Sujuv ja välkkiire punane võidusõidukorv. Parim tippkiirus sirgetel!',
    primaryColor: '#ef4444',
    secondaryColor: '#ffffff',
    type: 'speed',
    stats: {
      speed: 9,
      accel: 7,
      handling: 6,
      armor: 5,
    },
  },
  {
    id: 'buster_bull',
    name: 'Buster Bull',
    driverName: 'Bulldog Bob',
    driverAvatar: '🐂',
    description: 'Raske kollane jõumasin. Tõukab vastased teelt ja ei karda kokkupõrkeid!',
    primaryColor: '#eab308',
    secondaryColor: '#1e293b',
    type: 'heavy',
    stats: {
      speed: 6,
      accel: 6,
      handling: 5,
      armor: 10,
    },
  },
  {
    id: 'crazy_doc',
    name: 'Crazy Doc',
    driverName: 'Doc Wattson',
    driverAvatar: '⚡',
    description: 'Hullu teadlase elektriline retroauto. Kiirendab silmapilkselt ja kestab kaua!',
    primaryColor: '#06b6d4',
    secondaryColor: '#a855f7',
    type: 'tech',
    stats: {
      speed: 7,
      accel: 9,
      handling: 7,
      armor: 6,
    },
  },
  {
    id: 'kitten_cruiser',
    name: 'Kitten Cruiser',
    driverName: 'Mia Purr',
    driverAvatar: '🐱',
    description: 'Kassikõrvadega armas roosa rotster. Võtab kurve uskumatult täpselt ja libiseb ideaalselt!',
    primaryColor: '#ec4899',
    secondaryColor: '#fbcfe8',
    type: 'agile',
    stats: {
      speed: 7,
      accel: 8,
      handling: 10,
      armor: 4,
    },
  },
  {
    id: 'banana_bandit',
    name: 'Banana Bandit',
    driverName: 'Peel Pete',
    driverAvatar: '🍌',
    description: 'Lõbus banaanikujuline kollane hot-rod hiiglaslike leegitorudega!',
    primaryColor: '#facc15',
    secondaryColor: '#16a34a',
    type: 'wild',
    stats: {
      speed: 8,
      accel: 7,
      handling: 7,
      armor: 6,
    },
  },
  {
    id: 'police_donut',
    name: 'Police Donut',
    driverName: 'Officer Sarge',
    driverAvatar: '🚓',
    description: 'Vilkuvate sinipunaste tulukestega patrullauto. Rammib korda majja!',
    primaryColor: '#2563eb',
    secondaryColor: '#ffffff',
    type: 'cop',
    stats: {
      speed: 7,
      accel: 7,
      handling: 8,
      armor: 8,
    },
  },
];

export interface CarMeshContainer {
  root: THREE.Group;
  bodyMesh: THREE.Mesh;
  frontWheels: THREE.Group[];
  allWheels: THREE.Mesh[];
  driverHead: THREE.Group;
  exhaustLeft: THREE.Mesh;
  exhaustRight: THREE.Mesh;
  sirenLight?: THREE.PointLight;
}

/**
 * Creates a charming, high-poly 3D cartoon car with wheels, driver, and toon details
 */
export function createToonCarMesh(
  carDef: CarDefinition,
  colorOverride?: string,
  customization?: CarCustomization
): CarMeshContainer {
  const root = new THREE.Group();
  const mainColor = colorOverride || carDef.primaryColor;

  // Customization finish
  let bodyRoughness = 0.25;
  let bodyMetalness = 0.15;
  if (customization?.finish === 'metallic') {
    bodyRoughness = 0.2;
    bodyMetalness = 0.75;
  } else if (customization?.finish === 'matte') {
    bodyRoughness = 0.85;
    bodyMetalness = 0.05;
  }

  // Materials with vibrant cartoon arcade sheen
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(mainColor),
    roughness: bodyRoughness,
    metalness: bodyMetalness,
  });

  const secondaryMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(carDef.secondaryColor),
    roughness: 0.3,
  });

  const blackRubber = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.7,
  });

  // Custom rims
  let rimColor = 0xf4f4f5;
  let rimMetalness = 0.6;
  let rimRoughness = 0.2;
  let rimEmissive: number | undefined = undefined;

  if (customization?.rimStyle === 'gold') {
    rimColor = 0xfbbf24;
    rimMetalness = 0.9;
    rimRoughness = 0.15;
  } else if (customization?.rimStyle === 'cyber') {
    rimColor = 0x06b6d4;
    rimMetalness = 0.4;
    rimRoughness = 0.2;
    rimEmissive = 0x06b6d4;
  } else if (customization?.rimStyle === 'monster') {
    rimColor = 0x27272a;
    rimMetalness = 0.2;
    rimRoughness = 0.8;
  }

  const rimMaterial = new THREE.MeshStandardMaterial({
    color: rimColor,
    metalness: rimMetalness,
    roughness: rimRoughness,
    ...(rimEmissive ? { emissive: rimEmissive, emissiveIntensity: 0.5 } : {}),
  });

  // Underglow neon ground effect
  if (customization?.underglow && customization.underglow !== 'none') {
    const ugColor = new THREE.Color(customization.underglow);
    const glowGeo = new THREE.PlaneGeometry(1.6, 2.4);
    const glowMat = new THREE.MeshBasicMaterial({
      color: ugColor,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
    });
    const glowPlane = new THREE.Mesh(glowGeo, glowMat);
    glowPlane.rotation.x = Math.PI / 2;
    glowPlane.position.y = 0.08;
    root.add(glowPlane);

    const glowLight = new THREE.PointLight(ugColor, 1.2, 4.0);
    glowLight.position.set(0, 0.15, 0);
    root.add(glowLight);
  }

  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xbae6fd,
    transmission: 0.7,
    opacity: 0.85,
    transparent: true,
    roughness: 0.1,
    ior: 1.4,
  });

  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    metalness: 0.85,
    roughness: 0.1,
  });

  // 1. Lower Chassis
  const chassisGeo = new THREE.BoxGeometry(1.6, 0.45, 2.7);
  const chassis = new THREE.Mesh(chassisGeo, bodyMaterial);
  chassis.position.y = 0.45;
  chassis.castShadow = true;
  chassis.receiveShadow = true;
  root.add(chassis);

  // 2. Cabin / Cockpit Roof
  const cabinGeo = new THREE.BoxGeometry(1.2, 0.55, 1.4);
  const cabin = new THREE.Mesh(cabinGeo, bodyMaterial);
  cabin.position.set(0, 0.85, -0.15);
  cabin.castShadow = true;
  root.add(cabin);

  // 3. Windshield & Windows
  const windshieldGeo = new THREE.BoxGeometry(1.22, 0.48, 0.5);
  const windshield = new THREE.Mesh(windshieldGeo, glassMaterial);
  windshield.position.set(0, 0.82, 0.45);
  windshield.rotation.x = -Math.PI * 0.12;
  root.add(windshield);

  // 4. Cartoon Big Googly Headlights
  const lightGeo = new THREE.SphereGeometry(0.2, 16, 16);
  const lightMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xfef08a,
    emissiveIntensity: 0.8,
  });

  const leftEye = new THREE.Mesh(lightGeo, lightMat);
  leftEye.position.set(-0.55, 0.5, 1.35);
  leftEye.scale.set(1, 1, 0.7);
  root.add(leftEye);

  const rightEye = new THREE.Mesh(lightGeo, lightMat);
  rightEye.position.set(0.55, 0.5, 1.35);
  rightEye.scale.set(1, 1, 0.7);
  root.add(rightEye);

  // Pupil accents for cartoon personality!
  const pupilGeo = new THREE.SphereGeometry(0.08, 12, 12);
  const pupilMat = new THREE.MeshBasicMaterial({ color: 0x09090b });
  const p1 = new THREE.Mesh(pupilGeo, pupilMat);
  p1.position.set(-0.55, 0.5, 1.48);
  root.add(p1);
  const p2 = new THREE.Mesh(pupilGeo, pupilMat);
  p2.position.set(0.55, 0.5, 1.48);
  root.add(p2);

  // 5. Front Bumper
  const bumperGeo = new THREE.BoxGeometry(1.7, 0.22, 0.25);
  const bumper = new THREE.Mesh(bumperGeo, chromeMaterial);
  bumper.position.set(0, 0.32, 1.38);
  bumper.castShadow = true;
  root.add(bumper);

  // 6. Spoiler or Roof Prop depending on car type
  if (carDef.type === 'speed' || carDef.type === 'wild') {
    const spoilerWing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.4), secondaryMaterial);
    spoilerWing.position.set(0, 1.15, -1.2);
    spoilerWing.castShadow = true;
    root.add(spoilerWing);

    const standL = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.4), chromeMaterial);
    standL.position.set(-0.5, 0.95, -1.2);
    root.add(standL);
    const standR = standL.clone();
    standR.position.set(0.5, 0.95, -1.2);
    root.add(standR);
  } else if (carDef.type === 'agile') {
    // Cat ears!
    const earGeo = new THREE.ConeGeometry(0.18, 0.35, 4);
    const earL = new THREE.Mesh(earGeo, secondaryMaterial);
    earL.position.set(-0.4, 1.25, -0.1);
    earL.rotation.z = -0.2;
    root.add(earL);
    const earR = new THREE.Mesh(earGeo, secondaryMaterial);
    earR.position.set(0.4, 1.25, -0.1);
    earR.rotation.z = 0.2;
    root.add(earR);
  } else if (carDef.type === 'cop') {
    // Siren bar
    const sirenBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.2), chromeMaterial);
    sirenBar.position.set(0, 1.18, -0.15);
    root.add(sirenBar);

    const blueLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0x3b82f6, emissive: 0x3b82f6, emissiveIntensity: 1 })
    );
    blueLight.position.set(-0.25, 1.26, -0.15);
    root.add(blueLight);

    const redLight = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xef4444, emissiveIntensity: 1 })
    );
    redLight.position.set(0.25, 1.26, -0.15);
    root.add(redLight);
  } else if (carDef.type === 'tech') {
    // Lightning Tesla coil on roof
    const coil = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.12, 0.5, 8),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, emissive: 0x06b6d4, emissiveIntensity: 0.7 })
    );
    coil.position.set(0, 1.35, -0.2);
    root.add(coil);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.14, 12, 12),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, emissive: 0xa855f7, emissiveIntensity: 1 })
    );
    ball.position.set(0, 1.65, -0.2);
    root.add(ball);
  }

  // 7. Cartoon Driver Head
  const driverHead = new THREE.Group();
  driverHead.position.set(0, 0.95, -0.05);

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.5 })
  );
  driverHead.add(headMesh);

  // Helmet / Cap
  const helmetMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.55),
    secondaryMaterial
  );
  helmetMesh.position.y = 0.05;
  driverHead.add(helmetMesh);

  // Driver Goggles
  const goggleMesh = new THREE.Mesh(
    new THREE.TorusGeometry(0.09, 0.03, 8, 16),
    chromeMaterial
  );
  goggleMesh.position.set(-0.1, 0.05, 0.22);
  driverHead.add(goggleMesh);
  const goggleR = goggleMesh.clone();
  goggleR.position.x = 0.1;
  driverHead.add(goggleR);

  root.add(driverHead);

  // 8. Cartoon Oversized Wheels
  const wheelRadius = carDef.type === 'heavy' ? 0.42 : 0.35;
  const wheelWidth = 0.28;
  const wheelGeo = new THREE.CylinderGeometry(wheelRadius, wheelRadius, wheelWidth, 18);
  wheelGeo.rotateZ(Math.PI / 2);

  const hubGeo = new THREE.CylinderGeometry(wheelRadius * 0.55, wheelRadius * 0.55, wheelWidth + 0.02, 12);
  hubGeo.rotateZ(Math.PI / 2);

  const frontWheels: THREE.Group[] = [];
  const allWheels: THREE.Mesh[] = [];

  const wheelPositions = [
    { x: -0.9, y: wheelRadius, z: 0.85, isFront: true },
    { x: 0.9, y: wheelRadius, z: 0.85, isFront: true },
    { x: -0.92, y: wheelRadius, z: -0.85, isFront: false },
    { x: 0.92, y: wheelRadius, z: -0.85, isFront: false },
  ];

  wheelPositions.forEach((pos) => {
    const tire = new THREE.Mesh(wheelGeo, blackRubber);
    tire.castShadow = true;
    const rim = new THREE.Mesh(hubGeo, rimMaterial);
    tire.add(rim);

    if (pos.isFront) {
      const steerPivot = new THREE.Group();
      steerPivot.position.set(pos.x, pos.y, pos.z);
      steerPivot.add(tire);
      root.add(steerPivot);
      frontWheels.push(steerPivot);
    } else {
      tire.position.set(pos.x, pos.y, pos.z);
      root.add(tire);
    }
    allWheels.push(tire);
  });

  // 9. Dual Exhaust Pipes (Backfire ready)
  const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 12);
  exhaustGeo.rotateX(Math.PI / 2);

  const exhaustLeft = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustLeft.position.set(-0.45, 0.38, -1.45);
  root.add(exhaustLeft);

  const exhaustRight = new THREE.Mesh(exhaustGeo, chromeMaterial);
  exhaustRight.position.set(0.45, 0.38, -1.45);
  root.add(exhaustRight);

  return {
    root,
    bodyMesh: chassis,
    frontWheels,
    allWheels,
    driverHead,
    exhaustLeft,
    exhaustRight,
  };
}
