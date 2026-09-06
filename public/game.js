import * as THREE from "three";

// ========== DOM ==========
const canvas = document.getElementById("game");
const lapEl = document.getElementById("lap");
const posEl = document.getElementById("pos");
const powerNameEl = document.getElementById("power-name");
const hpHeartsEl = document.getElementById("hp-hearts");
const msgEl = document.getElementById("msg");
const playersOnlineEl = document.getElementById("players-online");
const nitroBar = document.getElementById("nitro-bar");
const hud = document.getElementById("hud");
const countdownEl = document.getElementById("countdown");
const touchControls = document.getElementById("touch-controls");

const menuScreen = document.getElementById("menu-screen");
const carScreen = document.getElementById("car-screen");
const startScreen = document.getElementById("start-screen");
const lobbyScreen = document.getElementById("lobby-screen");
const endScreen = document.getElementById("end-screen");
const endTitle = document.getElementById("end-title");
const endMsg = document.getElementById("end-msg");
const standingsEl = document.getElementById("standings");
const mapGrid = document.getElementById("map-grid");
const lobbyMapGrid = document.getElementById("lobby-map-grid");
const carGrid = document.getElementById("car-grid");
const startBtn = document.getElementById("start-btn");
const btnSingle = document.getElementById("btn-single");
const btnMulti = document.getElementById("btn-multi");
const carNext = document.getElementById("car-next");
const carBack = document.getElementById("car-back");
const mapBack = document.getElementById("map-back");
const lobbyBack = document.getElementById("lobby-back");
const btnCreateRoom = document.getElementById("btn-create-room");
const btnJoinRoom = document.getElementById("btn-join-room");
const joinCodeInput = document.getElementById("join-code");
const lobbyCreate = document.getElementById("lobby-create");
const lobbyRoom = document.getElementById("lobby-room");
const roomCodeDisplay = document.getElementById("room-code-display");
const playerListEl = document.getElementById("player-list");
const btnStartMp = document.getElementById("btn-start-mp");
const waitingMsg = document.getElementById("waiting-msg");
const lobbyStatus = document.getElementById("lobby-status");
const restartBtn = document.getElementById("restart-btn");
const endMenu = document.getElementById("end-menu");
const playerNameInput = document.getElementById("player-name");
const chkSound = document.getElementById("chk-sound");
const btnCopy = document.getElementById("btn-copy");
const hostBadge = document.getElementById("host-badge");
const roomListEl = document.getElementById("room-list");
const btnRefreshRooms = document.getElementById("btn-refresh-rooms");
const roomNameInput = document.getElementById("room-name");
const chkPublic = document.getElementById("chk-public");
const stickKnob = document.getElementById("stick-knob");
const stickZone = document.getElementById("stick-zone");
const btnFire = document.getElementById("btn-fire");
const btnDrift = document.getElementById("btn-drift");

const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

// ========== AUDIO ==========
let audioCtx = null, soundOn = true;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
function beep(freq, dur, type = "square", vol = 0.07) {
  if (!soundOn) return;
  try {
    ensureAudio();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + dur);
  } catch (e) {}
}
const sfx = {
  pickup: () => { beep(660, 0.07); setTimeout(() => beep(990, 0.09), 60); },
  rocket: () => beep(180, 0.14, "sawtooth", 0.05),
  hit: () => beep(85, 0.22, "sawtooth", 0.1),
  boost: () => beep(420, 0.18, "square", 0.06),
  count: () => beep(520, 0.12),
  go: () => beep(780, 0.22, "square", 0.09),
};
chkSound.onchange = () => { soundOn = chkSound.checked; };

// ========== CARS / MAPS DATA ==========
const CARS = [
  { id: "speedy", name: "Speedy", color: 0xffcc33, maxSpeed: 28, accel: 18, turn: 2.4, hp: 3, desc: "Kiire, tasakaalus" },
  { id: "tank", name: "Tank", color: 0xff5b6e, maxSpeed: 22, accel: 12, turn: 1.9, hp: 5, desc: "Aeglane, 5 elu" },
  { id: "drifter", name: "Drifter", color: 0x5b8cff, maxSpeed: 25, accel: 15, turn: 3.2, hp: 3, desc: "Parim juhtimine" },
  { id: "rocket", name: "Rocket", color: 0xc77dff, maxSpeed: 32, accel: 22, turn: 1.8, hp: 2, desc: "Max kiirus" },
];
let selectedCar = CARS[0];

const MAPS = [
  { id: "classic", name: "Klassikaline", desc: "Roheline ovaal", emoji: "🏁", type: "oval", ground: 0x2d5a27, road: 0x444444, sky: 0x87ceeb },
  { id: "desert", name: "Kõrb", desc: "Liivane", emoji: "🏜️", type: "oval", ground: 0xc2a15a, road: 0x8b6914, sky: 0xffe4b5, friction: 0.92 },
  { id: "ice", name: "Jää", desc: "Libe", emoji: "❄️", type: "oval", ground: 0xa8d5e5, road: 0xe8f4f8, sky: 0xb0e0e6, friction: 0.88 },
  { id: "night", name: "Öö", desc: "Neon", emoji: "🌙", type: "oval", ground: 0x0d1b2a, road: 0x1b263b, sky: 0x0a0a1a, neon: true },
  { id: "figure8", name: "Kaheksa", desc: "Ristuvad", emoji: "8️⃣", type: "figure8", ground: 0x3d5a3d, road: 0x4a4a4a, sky: 0x6a9fb5 },
];
let selectedMap = null, currentMap = MAPS[0];

function buildCarGrid() {
  carGrid.innerHTML = "";
  CARS.forEach((c) => {
    const card = document.createElement("div");
    card.className = "car-card" + (c === selectedCar ? " selected" : "");
    const hex = "#" + c.color.toString(16).padStart(6, "0");
    card.innerHTML = `<div class="car-preview" style="background:${hex}"></div><h3>${c.name}</h3><div class="car-stats">${c.desc}<br>${"❤️".repeat(c.hp)}</div>`;
    card.onclick = () => {
      carGrid.querySelectorAll(".car-card").forEach((x) => x.classList.remove("selected"));
      card.classList.add("selected");
      selectedCar = c;
    };
    carGrid.appendChild(card);
  });
}
buildCarGrid();

function buildMapGrid(container, onSelect) {
  container.innerHTML = "";
  MAPS.forEach((m) => {
    const card = document.createElement("div");
    card.className = "map-card";
    card.innerHTML = `<div class="preview" style="background:#${m.ground.toString(16).padStart(6,"0")}">${m.emoji}</div><h3>${m.name}</h3><small>${m.desc}</small>`;
    card.onclick = () => {
      container.querySelectorAll(".map-card").forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");
      selectedMap = m;
      onSelect && onSelect(m);
    };
    container.appendChild(card);
  });
}
buildMapGrid(mapGrid, () => {
  startBtn.disabled = false;
  startBtn.textContent = "Alusta – " + selectedMap.name;
});
buildMapGrid(lobbyMapGrid, (m) => {
  if (isHost && socket) socket.emit("setMap", { mapId: m.id });
});

// ========== THREE.JS SCENE ==========
let renderer, scene, camera, clock;
let trackGroup, worldGroup;
let ambientLight, sunLight;
const trackParams = { radius: 55, width: 14, tube: 0 };

function initThree() {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.5, 500);
  camera.position.set(0, 25, 40);
  clock = new THREE.Clock();

  ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);
  sunLight = new THREE.DirectionalLight(0xffffff, 1.1);
  sunLight.position.set(40, 80, 20);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(2048, 2048);
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 200;
  sunLight.shadow.camera.left = -90;
  sunLight.shadow.camera.right = 90;
  sunLight.shadow.camera.top = 90;
  sunLight.shadow.camera.bottom = -90;
  scene.add(sunLight);

  window.addEventListener("resize", onResize);
}

function onResize() {
  if (!renderer) return;
  const w = window.innerWidth, h = window.innerHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function clearWorld() {
  if (worldGroup) {
    scene.remove(worldGroup);
    worldGroup.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) {
        if (Array.isArray(o.material)) o.material.forEach((m) => m.dispose());
        else o.material.dispose();
      }
    });
  }
  worldGroup = new THREE.Group();
  scene.add(worldGroup);
}

function buildTrack3D(map) {
  clearWorld();
  scene.background = new THREE.Color(map.sky);
  scene.fog = new THREE.Fog(map.sky, 80, 220);

  // Ground plane
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(300, 300),
    new THREE.MeshLambertMaterial({ color: map.ground })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  worldGroup.add(ground);

  trackGroup = new THREE.Group();
  worldGroup.add(trackGroup);

  const roadMat = new THREE.MeshStandardMaterial({
    color: map.road,
    roughness: 0.85,
    metalness: 0.05,
  });
  const lineMat = new THREE.MeshBasicMaterial({ color: map.neon ? 0x00f5ff : 0xffffff });

  if (map.type === "figure8") {
    // Two loops
    for (const side of [-1, 1]) {
      const curve = new THREE.EllipseCurve(side * 28, 0, 30, 22, 0, Math.PI * 2, false, 0);
      addRoadFromCurve(curve, roadMat, lineMat, 80);
    }
  } else {
    const curve = new THREE.EllipseCurve(0, 0, trackParams.radius, trackParams.radius * 0.62, 0, Math.PI * 2, false, 0);
    addRoadFromCurve(curve, roadMat, lineMat, 100);
  }

  // Barriers
  addBarriers(map);

  // Decor trees / rocks
  addDecor(map);

  // Finish gate
  const gate = new THREE.Group();
  const poleGeo = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const p1 = new THREE.Mesh(poleGeo, poleMat);
  const p2 = new THREE.Mesh(poleGeo, poleMat);
  p1.position.set(trackParams.radius, 4, -6);
  p2.position.set(trackParams.radius, 4, 6);
  p1.castShadow = p2.castShadow = true;
  gate.add(p1, p2);
  const banner = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 1.5, 12),
    new THREE.MeshStandardMaterial({ color: 0xffcc33 })
  );
  banner.position.set(trackParams.radius, 8, 0);
  gate.add(banner);
  worldGroup.add(gate);
}

function addRoadFromCurve(ellipseCurve, roadMat, lineMat, segments) {
  const pts2 = ellipseCurve.getPoints(segments);
  const points = pts2.map((p) => new THREE.Vector3(p.x, 0, p.y));
  // Closed path
  const path = new THREE.CatmullRomCurve3(points, true);

  // Road as tube-ish ribbon using Shape extrusion along path is heavy;
  // use many box segments for cartoon look
  const w = trackParams.width;
  for (let i = 0; i < segments; i++) {
    const t0 = i / segments;
    const t1 = (i + 1) / segments;
    const a = path.getPointAt(t0);
    const b = path.getPointAt(t1);
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const dir = b.clone().sub(a);
    const len = dir.length();
    const angle = Math.atan2(dir.x, dir.z);
    const seg = new THREE.Mesh(
      new THREE.BoxGeometry(w, 0.4, len + 0.15),
      roadMat
    );
    seg.position.set(mid.x, 0.2, mid.z);
    seg.rotation.y = angle;
    seg.receiveShadow = true;
    trackGroup.add(seg);

    // center dashed line
    if (i % 2 === 0) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.42, len * 0.45), lineMat);
      line.position.set(mid.x, 0.22, mid.z);
      line.rotation.y = angle;
      trackGroup.add(line);
    }
  }
}

function addBarriers(map) {
  const mat = new THREE.MeshStandardMaterial({ color: map.neon ? 0xff3366 : 0xcccccc, roughnessness: 0.6 });
  const count = 48;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const rOut = trackParams.radius + trackParams.width * 0.55;
    const rIn = trackParams.radius - trackParams.width * 0.55;
    for (const r of [rOut, rIn]) {
      const x = Math.cos(a) * r * (currentMap.type === "figure8" ? 1 : 1);
      const z = Math.sin(a) * r * 0.62;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1.2, 0.6), mat);
      post.position.set(x, 0.6, z);
      post.castShadow = true;
      worldGroup.add(post);
    }
  }
}

function addDecor(map) {
  const treeMat = new THREE.MeshLambertMaterial({ color: map.ground === 0xc2a15a ? 0xa07830 : 0x1e4d1a });
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
  for (let i = 0; i < 30; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = trackParams.radius + 18 + Math.random() * 35;
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r * 0.7;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 2, 6), trunkMat);
    trunk.position.set(x, 1, z);
    trunk.castShadow = true;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(2 + Math.random(), 8, 6), treeMat);
    crown.position.set(x, 3.2, z);
    crown.castShadow = true;
    worldGroup.add(trunk, crown);
  }
}

// ========== CAR MESH ==========
function createCarMesh(color) {
  const g = new THREE.Group();
  const bodyMat = new THREE.MeshStandardMaterial({ color, roughness: 0.4, metalness: 0.2 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x222222, roughnessness: 0.5 });
  const glass = new THREE.MeshStandardMaterial({ color: 0x88ccee, transparent: true, opacity: 0.7 });
  const body = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 4.2), bodyMat);
  body.position.y = 0.55;
  body.castShadow = true;
  g.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.7, 2), glass);
  cabin.position.set(0, 1.15, -0.2);
  cabin.castShadow = true;
  g.add(cabin);
  // wheels
  const wheelGeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12);
  for (const [x, z] of [[-1.1, 1.3], [1.1, 1.3], [-1.1, -1.3], [1.1, -1.3]]) {
    const w = new THREE.Mesh(wheelGeo, dark);
    w.rotation.z = Math.PI / 2;
    w.position.set(x, 0.45, z);
    w.castShadow = true;
    g.add(w);
  }
  // headlights
  const lightMat = new THREE.MeshStandardMaterial({ color: 0xffe066, emissive: 0xffaa00, emissiveIntensity: 0.5 });
  for (const x of [-0.7, 0.7]) {
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.25, 0.15), lightMat);
    h.position.set(x, 0.6, 2.1);
    g.add(h);
  }
  // spoiler
  const spoiler = new THREE.Mesh(new THREE.BoxGeometry(2, 0.15, 0.5), bodyMat);
  spoiler.position.set(0, 1.1, -2);
  g.add(spoiler);
  return g;
}

function createItemBoxMesh() {
  const g = new THREE.Group();
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1.6, 1.6, 1.6),
    new THREE.MeshStandardMaterial({ color: 0xffcc33, emissive: 0xaa8800, emissiveIntensity: 0.3 })
  );
  box.castShadow = true;
  g.add(box);
  return g;
}

function createRocketMesh() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.25, 1.4, 8),
    new THREE.MeshStandardMaterial({ color: 0xff3333, emissive: 0xff2200, emissiveIntensity: 0.4 })
  );
  body.rotation.x = Math.PI / 2;
  g.add(body);
  return g;
}

// ========== GAME ENTITIES ==========
const POWER_TYPES = [
  { id: "rocket", name: "🚀 Rakett", weight: 28 },
  { id: "boost", name: "⚡ Nitro", weight: 26 },
  { id: "shield", name: "🛡️ Kilp", weight: 20 },
  { id: "mine", name: "💣 Miin", weight: 16 },
  { id: "oil", name: "🛢️ Õli", weight: 10 },
];
function randomPower() {
  const total = POWER_TYPES.reduce((s, p) => s + p.weight, 0);
  let r = Math.random() * total;
  for (const p of POWER_TYPES) { r -= p.weight; if (r <= 0) return p; }
  return POWER_TYPES[0];
}

class Car {
  constructor(x, z, angle, def, id, name, isLocal = false, isAI = false) {
    this.id = id;
    this.def = def;
    this.name = name;
    this.isLocal = isLocal;
    this.isAI = isAI;
    this.x = x;
    this.z = z;
    this.y = 0;
    this.angle = angle; // yaw around Y
    this.speed = 0;
    this.maxSpeed = isAI ? def.maxSpeed * 0.85 : def.maxSpeed;
    this.accel = isAI ? def.accel * 0.8 : def.accel;
    this.turnSpeed = isAI ? def.turn * 0.8 : def.turn;
    this.friction = currentMap.friction || 0.97;
    this.hp = def.hp;
    this.maxHp = def.hp;
    this.power = null;
    this.boostTimer = 0;
    this.shield = 0;
    this.hitFlash = 0;
    this.alive = true;
    this.respawnTimer = 0;
    this.lap = 0;
    this.progress = 0;
    this.lastAng = Math.atan2(z, x);
    this.aiTimer = 0;
    this.aiFire = 1 + Math.random();
    this.mesh = createCarMesh(def.color);
    this.mesh.position.set(x, 0, z);
    this.mesh.rotation.y = angle;
    worldGroup.add(this.mesh);
    this.targetX = x; this.targetZ = z; this.targetAngle = angle;
    this.nameSprite = null;
  }

  takeDamage() {
    if (this.shield > 0) { this.shield = 0; return; }
    this.hp--;
    this.hitFlash = 0.4;
    this.speed *= 0.3;
    if (this.isLocal) updateHpHud();
    if (this.hp <= 0) {
      this.alive = false;
      this.respawnTimer = 1.8;
      this.power = null;
      if (this.isLocal) powerNameEl.textContent = "–";
      this.mesh.visible = false;
    }
  }

  respawn() {
    this.alive = true;
    this.hp = this.maxHp;
    if (this.isLocal) updateHpHud();
    const a = this.lastAng;
    const r = trackParams.radius;
    this.x = Math.cos(a) * r;
    this.z = Math.sin(a) * r * 0.62;
    this.angle = a + Math.PI / 2;
    this.speed = 0;
    this.mesh.visible = true;
    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.angle;
  }

  update(dt, rockets, boxes) {
    if (!this.alive) {
      this.respawnTimer -= dt;
      if (this.respawnTimer <= 0) this.respawn();
      return;
    }
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.boostTimer > 0) this.boostTimer -= dt;
    if (this.shield > 0) this.shield -= dt;

    if (!this.isLocal && !this.isAI) {
      this.x += (this.targetX - this.x) * Math.min(1, dt * 10);
      this.z += (this.targetZ - this.z) * Math.min(1, dt * 10);
      let da = this.targetAngle - this.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      this.angle += da * Math.min(1, dt * 10);
      this.mesh.position.set(this.x, 0, this.z);
      this.mesh.rotation.y = this.angle;
      return;
    }

    let accel = 0, turn = 0, usePower = false, drift = false;
    if (this.isLocal) {
      if (keys["ArrowUp"] || keys["KeyW"] || touch.forward) accel = 1;
      if (keys["ArrowDown"] || keys["KeyS"] || touch.back) accel = -0.5;
      if (keys["ArrowLeft"] || keys["KeyA"] || touch.left) turn = 1;
      if (keys["ArrowRight"] || keys["KeyD"] || touch.right) turn = -1;
      if (touch.ax || touch.ay) {
        turn = -touch.ax;
        if (touch.ay < -0.2) accel = 1;
        if (touch.ay > 0.35) accel = -0.45;
      }
      if (keys["Space"] || touch.fire) usePower = true;
      if (keys["ShiftLeft"] || keys["ShiftRight"] || touch.drift) drift = true;
    } else if (this.isAI) {
      this.aiTimer -= dt;
      const ang = Math.atan2(this.z, this.x);
      const desired = ang + Math.PI / 2;
      let da = desired - this.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      turn = Math.max(-1, Math.min(1, -da * 2));
      accel = 1;
      if (Math.abs(da) > 0.5) drift = true;
      this.aiFire -= dt;
      if (this.power && this.aiFire <= 0) { usePower = true; this.aiFire = 1.5 + Math.random() * 2; }
    }

    const boost = this.boostTimer > 0 ? 1.5 : 1;
    const turnMul = drift ? 1.5 : 1;
    const fric = drift ? 0.99 : this.friction;

    if (accel > 0) this.speed += this.accel * accel * boost * dt;
    else if (accel < 0) this.speed += this.accel * accel * 1.4 * dt;
    this.speed *= Math.pow(fric, dt * 60);
    this.speed = Math.max(-this.maxSpeed * 0.3, Math.min(this.maxSpeed * boost, this.speed));

    if (Math.abs(this.speed) > 0.5) {
      this.angle += turn * this.turnSpeed * turnMul * (this.speed > 0 ? 1 : -1) * dt;
    }

    this.x += Math.sin(this.angle) * this.speed * dt;
    this.z += Math.cos(this.angle) * this.speed * dt;

    // Soft track constraint (ellipse)
    const rx = trackParams.radius, rz = trackParams.radius * 0.62;
    const nx = this.x / rx, nz = this.z / rz;
    const d = Math.sqrt(nx * nx + nz * nz);
    const halfW = trackParams.width * 0.45 / rx;
    if (d > 1 + halfW || d < 1 - halfW) {
      const target = THREE.MathUtils.clamp(d, 1 - halfW * 0.9, 1 + halfW * 0.9);
      this.x = (nx / (d || 1)) * target * rx;
      this.z = (nz / (d || 1)) * target * rz;
      this.speed *= 0.85;
    }

    // Progress / laps
    const ang = Math.atan2(this.z, this.x);
    let dAng = ang - this.lastAng;
    if (dAng > Math.PI) dAng -= Math.PI * 2;
    if (dAng < -Math.PI) dAng += Math.PI * 2;
    this.progress -= dAng; // clockwise
    this.lastAng = ang;
    const laps = Math.floor(this.progress / (Math.PI * 2));
    if (laps > this.lap && this.x > 0) {
      this.lap = laps;
      if (this.isLocal && this.lap >= 3) endRace(true);
    }

    // boxes
    for (const box of boxes) {
      if (!box.alive) continue;
      if (Math.hypot(box.x - this.x, box.z - this.z) < 3) {
        box.alive = false;
        box.respawn = 5;
        box.mesh.visible = false;
        if (!this.power) {
          this.power = randomPower();
          if (this.isLocal) {
            powerNameEl.textContent = this.power.name;
            showMsg("Said: " + this.power.name);
            sfx.pickup();
          }
          if (isMulti) broadcast({ type: "boxTaken", boxId: box.id });
        }
      }
    }

    if (usePower && this.power) this.activatePower(rockets);

    this.mesh.position.set(this.x, 0, this.z);
    this.mesh.rotation.y = this.angle;
    // lean
    this.mesh.rotation.z = THREE.MathUtils.clamp(-turn * 0.15 * Math.sign(this.speed), -0.25, 0.25);

    if (this.isLocal) {
      nitroBar.style.width = (this.boostTimer > 0 ? Math.min(100, (this.boostTimer / 1.9) * 100) : 0) + "%";
    }
  }

  activatePower(rockets) {
    const p = this.power;
    this.power = null;
    if (this.isLocal) powerNameEl.textContent = "–";
    if (p.id === "rocket") {
      const ox = this.x + Math.sin(this.angle) * 3;
      const oz = this.z + Math.cos(this.angle) * 3;
      rockets.push(new Rocket(ox, oz, this.angle, this.id));
      if (this.isLocal) { showMsg("Rakett!"); sfx.rocket(); }
      if (isMulti) broadcast({ type: "rocket", x: ox, z: oz, angle: this.angle, ownerId: this.id });
    } else if (p.id === "boost") {
      this.boostTimer = 1.9;
      if (this.isLocal) { showMsg("Nitro!"); sfx.boost(); }
      if (isMulti) broadcast({ type: "boost", playerId: this.id });
    } else if (p.id === "shield") {
      this.shield = 5;
      if (this.isLocal) showMsg("Kilp!");
      if (isMulti) broadcast({ type: "shield", playerId: this.id });
    } else if (p.id === "mine" || p.id === "oil") {
      // simplified: treat as slow nearby via broadcast oil at rear
      const ox = this.x - Math.sin(this.angle) * 4;
      const oz = this.z - Math.cos(this.angle) * 4;
      if (isMulti) broadcast({ type: "oil", x: ox, z: oz });
      if (this.isLocal) showMsg(p.name);
    }
  }

  applyRemoteState(s) {
    this.targetX = s.x; this.targetZ = s.z; this.targetAngle = s.angle;
    this.speed = s.speed; this.lap = s.lap; this.progress = s.progress;
    this.boostTimer = s.boostTimer || 0; this.shield = s.shield || 0;
    this.alive = s.alive; this.hp = s.hp != null ? s.hp : this.hp;
    this.mesh.visible = this.alive;
  }
}

class ItemBox {
  constructor(x, z, id) {
    this.id = id; this.x = x; this.z = z;
    this.alive = true; this.respawn = 0; this.phase = Math.random() * 10;
    this.mesh = createItemBoxMesh();
    this.mesh.position.set(x, 1.5, z);
    worldGroup.add(this.mesh);
  }
  update(dt) {
    this.phase += dt * 2;
    if (!this.alive) {
      this.respawn -= dt;
      if (this.respawn <= 0) { this.alive = true; this.mesh.visible = true; }
      return;
    }
    this.mesh.position.y = 1.5 + Math.sin(this.phase) * 0.4;
    this.mesh.rotation.y += dt * 1.5;
  }
}

class Rocket {
  constructor(x, z, angle, ownerId) {
    this.x = x; this.z = z; this.angle = angle; this.ownerId = ownerId;
    this.speed = 45; this.life = 2.5; this.alive = true; this.homing = 2.5;
    this.mesh = createRocketMesh();
    this.mesh.position.set(x, 1, z);
    worldGroup.add(this.mesh);
  }
  update(dt, carsList) {
    this.life -= dt;
    if (this.life <= 0) { this.alive = false; worldGroup.remove(this.mesh); return; }
    let best = null, bestD = 40;
    for (const c of carsList) {
      if (c.id === this.ownerId || !c.alive || c.shield > 0) continue;
      const d = Math.hypot(c.x - this.x, c.z - this.z);
      if (d < bestD) { best = c; bestD = d; }
    }
    if (best) {
      const desired = Math.atan2(best.x - this.x, best.z - this.z);
      let da = desired - this.angle;
      while (da > Math.PI) da -= Math.PI * 2;
      while (da < -Math.PI) da += Math.PI * 2;
      this.angle += da * this.homing * dt;
    }
    this.x += Math.sin(this.angle) * this.speed * dt;
    this.z += Math.cos(this.angle) * this.speed * dt;
    this.mesh.position.set(this.x, 1, this.z);
    this.mesh.rotation.y = this.angle;

    for (const c of carsList) {
      if (c.id === this.ownerId || !c.alive) continue;
      if (Math.hypot(c.x - this.x, c.z - this.z) < 2.5) {
        if (c.shield > 0) c.shield = 0;
        else { c.takeDamage(); sfx.hit(); }
        this.alive = false;
        worldGroup.remove(this.mesh);
        break;
      }
    }
  }
}

// ========== INPUT ==========
const keys = {};
const touch = { ax: 0, ay: 0, forward: false, back: false, left: false, right: false, fire: false, drift: false };
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","ShiftLeft","ShiftRight"].includes(e.code)) e.preventDefault();
  ensureAudio();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

let stickActive = false;
function handleStick(cx, cy) {
  const rect = stickZone.getBoundingClientRect();
  const mx = rect.left + rect.width / 2, my = rect.top + rect.height / 2;
  let dx = cx - mx, dy = cy - my;
  const max = 36, len = Math.hypot(dx, dy);
  if (len > max) { dx = (dx / len) * max; dy = (dy / len) * max; }
  stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  touch.ax = dx / max; touch.ay = dy / max;
}
function resetStick() {
  stickActive = false;
  stickKnob.style.transform = "translate(-50%,-50%)";
  touch.ax = 0; touch.ay = 0;
}
stickZone.addEventListener("touchstart", (e) => { e.preventDefault(); stickActive = true; handleStick(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
stickZone.addEventListener("touchmove", (e) => { e.preventDefault(); if (stickActive) handleStick(e.touches[0].clientX, e.touches[0].clientY); }, { passive: false });
stickZone.addEventListener("touchend", resetStick);
btnFire.addEventListener("touchstart", (e) => { e.preventDefault(); touch.fire = true; }, { passive: false });
btnFire.addEventListener("touchend", () => { touch.fire = false; });
btnDrift.addEventListener("touchstart", (e) => { e.preventDefault(); touch.drift = true; }, { passive: false });
btnDrift.addEventListener("touchend", () => { touch.drift = false; });

// ========== MULTIPLAYER ==========
let socket = null, isHost = false, isMulti = false, myPeerId = null;
let remotePlayers = {}, localPlayerName = "Mängija";
const playerColors = ["#ffcc33", "#ff5b6e", "#5b8cff", "#5dffa8", "#c77dff", "#f4a261"];

function getName() { return (playerNameInput.value.trim() || "Mängija").slice(0, 12); }
function setStatus(t, isErr) {
  lobbyStatus.textContent = t || "";
  lobbyStatus.classList.toggle("error", !!isErr);
}
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}

function ensureSocket() {
  if (socket && socket.connected) return socket;
  if (socket) try { socket.disconnect(); } catch (e) {}
  socket = io({ transports: ["websocket", "polling"] });
  socket.on("connect", () => { myPeerId = socket.id; setStatus("Serveriga ühendatud"); });
  socket.on("disconnect", () => setStatus("Ühendus katkes", true));
  socket.on("rooms", renderRoomList);
  socket.on("room", onRoomUpdate);
  socket.on("start", onRaceStart);
  socket.on("game", onGameEvent);
  socket.on("playerLeft", (d) => {
    cars = cars.filter((c) => {
      if (c.id === d.id) { worldGroup.remove(c.mesh); return false; }
      return true;
    });
    delete remotePlayers[d.id];
  });
  return socket;
}

function renderRoomList(list) {
  if (!roomListEl) return;
  if (!list || !list.length) {
    roomListEl.innerHTML = '<div class="muted-line">Avalikke tube pole – loo ise!</div>';
    return;
  }
  roomListEl.innerHTML = list.map((r) => `
    <div class="room-row">
      <div>
        <div class="title">${escapeHtml(r.name || r.code)}</div>
        <div class="meta">${escapeHtml(r.hostName || "?")} · ${r.players}/${r.maxPlayers}${r.racing ? " · mäng käib" : ""} · ${r.code}</div>
      </div>
      <button type="button" class="btn tiny" data-code="${r.code}" ${r.racing || r.players >= r.maxPlayers ? "disabled" : ""}>Liitu</button>
    </div>`).join("");
  roomListEl.querySelectorAll("button[data-code]").forEach((btn) => {
    btn.onclick = () => { joinCodeInput.value = btn.dataset.code; joinRoom(); };
  });
}

function onRoomUpdate(room) {
  if (!room) return;
  isHost = room.hostId === myPeerId;
  remotePlayers = {};
  (room.players || []).forEach((p) => {
    if (p.id !== myPeerId) remotePlayers[p.id] = { name: p.name, color: p.color };
  });
  roomCodeDisplay.textContent = room.code;
  lobbyCreate.classList.add("hidden");
  lobbyRoom.classList.remove("hidden");
  playerListEl.innerHTML = (room.players || []).map((p) =>
    `<div class="pl"><span class="pl-dot" style="background:${p.color || "#5b8cff"}"></span><span>${escapeHtml(p.name)}${p.host ? " · host" : ""}</span></div>`
  ).join("");
  if (isHost) {
    btnStartMp.classList.remove("hidden");
    waitingMsg.classList.add("hidden");
    hostBadge.classList.remove("hidden");
  } else {
    btnStartMp.classList.add("hidden");
    waitingMsg.classList.remove("hidden");
    hostBadge.classList.add("hidden");
  }
  if (room.mapId) {
    selectedMap = MAPS.find((m) => m.id === room.mapId) || selectedMap;
    lobbyMapGrid.querySelectorAll(".map-card").forEach((c, i) => c.classList.toggle("selected", MAPS[i].id === room.mapId));
  }
  setStatus(isHost ? "Oled host" : "Ootad hosti…");
}

function onRaceStart(msg) {
  currentMap = MAPS.find((m) => m.id === msg.mapId) || MAPS[0];
  selectedMap = currentMap;
  startMultiRace(msg.players || []);
}

function onGameEvent(payload) {
  if (!payload || payload.from === myPeerId) return;
  const msg = payload;
  switch (msg.type) {
    case "state": {
      const car = cars.find((c) => c.id === msg.id);
      if (car && !car.isLocal) car.applyRemoteState(msg);
      break;
    }
    case "rocket":
      rockets.push(new Rocket(msg.x, msg.z, msg.angle, msg.ownerId));
      break;
    case "boost": {
      const c = cars.find((c) => c.id === msg.playerId);
      if (c) c.boostTimer = 1.9;
      break;
    }
    case "shield": {
      const c = cars.find((c) => c.id === msg.playerId);
      if (c) c.shield = 5;
      break;
    }
    case "boxTaken": {
      const b = boxes.find((b) => b.id === msg.boxId);
      if (b) { b.alive = false; b.respawn = 5; b.mesh.visible = false; }
      break;
    }
  }
}

function broadcast(data) {
  if (!socket || !socket.connected || !isMulti) return;
  socket.emit("game", data);
}

function createRoom() {
  localPlayerName = getName();
  ensureSocket();
  setStatus("Loon tuba…");
  socket.emit("createRoom", {
    playerName: localPlayerName,
    roomName: (roomNameInput && roomNameInput.value.trim()) || localPlayerName + " tuba",
    public: !chkPublic || chkPublic.checked,
    color: "#ffcc33",
  }, (res) => {
    if (!res || !res.ok) { setStatus((res && res.error) || "Viga", true); return; }
    isMulti = true; isHost = true; myPeerId = socket.id;
    onRoomUpdate(res.room);
  });
}

function joinRoom() {
  localPlayerName = getName();
  const code = joinCodeInput.value.trim().toUpperCase();
  if (!code) { setStatus("Sisesta kood", true); return; }
  ensureSocket();
  setStatus("Liitun…");
  socket.emit("joinRoom", {
    code,
    playerName: localPlayerName,
    color: playerColors[Math.floor(Math.random() * playerColors.length)],
  }, (res) => {
    if (!res || !res.ok) { setStatus((res && res.error) || "Viga", true); return; }
    isMulti = true; isHost = res.room.hostId === socket.id; myPeerId = socket.id;
    onRoomUpdate(res.room);
  });
}

function leaveServerRoom() {
  if (socket) socket.emit("leaveRoom");
  isHost = false; isMulti = false; remotePlayers = {};
}

if (btnRefreshRooms) btnRefreshRooms.onclick = () => { ensureSocket(); socket.emit("listRooms"); };

// ========== GAME STATE ==========
let cars = [], rockets = [], boxes = [];
let player = null, running = false, raceEnded = false, syncTimer = 0;
const aiNames = ["Speedy", "Turbo", "Zoom", "Bolt"];

function showMsg(t) {
  msgEl.textContent = t;
  clearTimeout(showMsg._t);
  showMsg._t = setTimeout(() => (msgEl.textContent = ""), 900);
}
function updateHpHud() {
  if (!player) return;
  hpHeartsEl.textContent = "❤️".repeat(Math.max(0, player.hp)) + "🖤".repeat(Math.max(0, player.maxHp - player.hp));
}

function spawnBoxes() {
  boxes = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const r = trackParams.radius;
    boxes.push(new ItemBox(Math.cos(a) * r, Math.sin(a) * r * 0.62, "box" + i));
  }
}

function doCountdown(cb) {
  countdownEl.classList.remove("hidden");
  let n = 3;
  countdownEl.textContent = n;
  sfx.count();
  const iv = setInterval(() => {
    n--;
    if (n > 0) { countdownEl.textContent = n; sfx.count(); }
    else if (n === 0) { countdownEl.textContent = "GO!"; sfx.go(); }
    else { clearInterval(iv); countdownEl.classList.add("hidden"); cb(); }
  }, 700);
}

function hideMenus() {
  menuScreen.classList.add("hidden");
  carScreen.classList.add("hidden");
  startScreen.classList.add("hidden");
  lobbyScreen.classList.add("hidden");
  endScreen.classList.add("hidden");
  hud.classList.remove("hidden");
  if (isTouch) touchControls.classList.remove("hidden");
}

function startSingleRace() {
  if (!selectedMap) return;
  isMulti = false;
  currentMap = selectedMap;
  if (!renderer) initThree();
  buildTrack3D(currentMap);
  cars = []; rockets = [];
  raceEnded = false;
  hideMenus();

  const startX = trackParams.radius, startZ = 0;
  player = new Car(startX, startZ + 2, Math.PI / 2, selectedCar, "local", getName(), true, false);
  cars.push(player);
  for (let i = 0; i < 4; i++) {
    const def = CARS[i % CARS.length];
    cars.push(new Car(startX - 2 - i, startZ - 3 + i * 1.5, Math.PI / 2, def, "ai" + i, aiNames[i], false, true));
  }
  spawnBoxes();
  powerNameEl.textContent = "–";
  lapEl.textContent = "1";
  posEl.textContent = "1";
  playersOnlineEl.textContent = "";
  updateHpHud();
  doCountdown(() => {
    running = true;
    clock.start();
    requestAnimationFrame(loop);
  });
}

function startMultiRace(playerInfo) {
  currentMap = selectedMap || MAPS[0];
  if (!renderer) initThree();
  buildTrack3D(currentMap);
  cars = []; rockets = [];
  raceEnded = false;
  hideMenus();

  const all = playerInfo || [];
  if (!all.find((p) => p.id === myPeerId)) {
    all.unshift({ id: myPeerId, name: localPlayerName, color: "#ffcc33" });
  }
  all.forEach((p, i) => {
    const isLocal = p.id === myPeerId;
    const def = isLocal ? selectedCar : CARS[i % CARS.length];
    const c = new Car(trackParams.radius - i * 2, i * 2 - 3, Math.PI / 2, def, p.id, p.name, isLocal, false);
    if (!isLocal && p.color) {
      // recolor roughly
      c.mesh.traverse((o) => {
        if (o.isMesh && o.material && o.material.color && o.geometry?.type === "BoxGeometry") {
          try { o.material.color.set(p.color); } catch (e) {}
        }
      });
    }
    cars.push(c);
    if (isLocal) player = c;
  });
  spawnBoxes();
  powerNameEl.textContent = "–";
  lapEl.textContent = "1";
  posEl.textContent = "1";
  playersOnlineEl.textContent = cars.length + " mängijat";
  updateHpHud();
  doCountdown(() => {
    running = true;
    clock.start();
    requestAnimationFrame(loop);
  });
}

function endRace(won) {
  if (raceEnded) return;
  raceEnded = true;
  running = false;
  hud.classList.add("hidden");
  touchControls.classList.add("hidden");
  endScreen.classList.remove("hidden");
  const sorted = [...cars].sort((a, b) => b.progress - a.progress);
  standingsEl.innerHTML = sorted.map((c, i) =>
    `<div class="place${c === player ? " me" : ""}"><span>${i + 1}. ${c.name}</span><span>R${Math.min(3, c.lap + 1)}</span></div>`
  ).join("");
  if (won) { endTitle.textContent = "Võitsid!"; endMsg.textContent = "Suurepärane 3D sõit!"; }
  else {
    const place = sorted.findIndex((c) => c === player) + 1;
    endTitle.textContent = place <= 3 ? `Koht #${place}` : "Finiš";
    endMsg.textContent = `Sinu koht: ${place}`;
  }
}

function getPosition() {
  return [...cars].sort((a, b) => b.progress - a.progress).findIndex((c) => c === player) + 1;
}

// Camera follow
const camOffset = new THREE.Vector3(0, 12, -22);
const camLook = new THREE.Vector3();
const camPos = new THREE.Vector3();

function updateCamera(dt) {
  if (!player) return;
  const back = new THREE.Vector3(Math.sin(player.angle) * -22, 12, Math.cos(player.angle) * -22);
  const desired = new THREE.Vector3(player.x, 0, player.z).add(back);
  camera.position.lerp(desired, 1 - Math.pow(0.001, dt));
  camLook.set(player.x + Math.sin(player.angle) * 8, 1.5, player.z + Math.cos(player.angle) * 8);
  camera.lookAt(camLook);
}

function loop() {
  if (!running) return;
  const dt = Math.min(0.05, clock.getDelta());

  for (const c of cars) c.update(dt, rockets, boxes);
  for (let i = rockets.length - 1; i >= 0; i--) {
    rockets[i].update(dt, cars);
    if (!rockets[i].alive) rockets.splice(i, 1);
  }
  for (const b of boxes) b.update(dt);

  if (isMulti && player) {
    syncTimer += dt;
    if (syncTimer > 0.05) {
      syncTimer = 0;
      broadcast({
        type: "state",
        id: player.id,
        x: player.x, z: player.z, angle: player.angle,
        speed: player.speed, lap: player.lap, progress: player.progress,
        boostTimer: player.boostTimer, shield: player.shield,
        alive: player.alive, hp: player.hp,
      });
    }
  }

  if (player) {
    lapEl.textContent = Math.min(3, player.lap + 1);
    posEl.textContent = getPosition();
  }

  updateCamera(dt);
  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// ========== UI ==========
btnSingle.onclick = () => { ensureAudio(); menuScreen.classList.add("hidden"); carScreen.classList.remove("hidden"); };
btnMulti.onclick = () => {
  ensureAudio();
  menuScreen.classList.add("hidden");
  lobbyScreen.classList.remove("hidden");
  lobbyCreate.classList.remove("hidden");
  lobbyRoom.classList.add("hidden");
  setStatus("");
  ensureSocket();
  socket.emit("listRooms");
};
carNext.onclick = () => { carScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); };
carBack.onclick = () => { carScreen.classList.add("hidden"); menuScreen.classList.remove("hidden"); };
mapBack.onclick = () => { startScreen.classList.add("hidden"); carScreen.classList.remove("hidden"); };
lobbyBack.onclick = () => {
  leaveServerRoom();
  lobbyScreen.classList.add("hidden");
  menuScreen.classList.remove("hidden");
};
btnCreateRoom.onclick = createRoom;
btnJoinRoom.onclick = joinRoom;
joinCodeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") joinRoom(); });
btnCopy.onclick = () => {
  navigator.clipboard.writeText(roomCodeDisplay.textContent).then(() => setStatus("Kood kopeeritud")).catch(() => {});
};
btnStartMp.onclick = () => {
  if (!isHost || !selectedMap) { setStatus("Vali rada", true); return; }
  if (socket) socket.emit("startRace", { mapId: selectedMap.id });
};
startBtn.onclick = startSingleRace;
restartBtn.onclick = () => {
  endScreen.classList.add("hidden");
  if (isMulti) {
    if (socket) socket.emit("raceOver");
    lobbyScreen.classList.remove("hidden");
    lobbyRoom.classList.remove("hidden");
  } else startScreen.classList.remove("hidden");
};
endMenu.onclick = () => {
  endScreen.classList.add("hidden");
  if (socket && isMulti) socket.emit("raceOver");
  leaveServerRoom();
  menuScreen.classList.remove("hidden");
};

playerNameInput.value = "Mängija" + Math.floor(Math.random() * 90 + 10);

// Init three in background so first race is faster
initThree();
scene.background = new THREE.Color(0x0f1220);
renderer.render(scene, camera);
