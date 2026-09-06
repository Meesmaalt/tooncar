(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const minimap = document.getElementById("minimap");
  const mctx = minimap.getContext("2d");
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
  const recentRoomsEl = document.getElementById("recent-rooms");
  const recentListEl = document.getElementById("recent-list");
  const stickKnob = document.getElementById("stick-knob");
  const stickZone = document.getElementById("stick-zone");
  const btnFire = document.getElementById("btn-fire");
  const btnDrift = document.getElementById("btn-drift");

  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  window.addEventListener("resize", resize); resize();
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  // Audio
  let audioCtx = null, soundOn = true;
  function ensureAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
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
    drift: () => beep(120, 0.05, "sawtooth", 0.03),
  };
  chkSound.onchange = () => { soundOn = chkSound.checked; };

  // Recent rooms (localStorage)
  const RECENT_KEY = "tcr_recent_rooms";
  function loadRecent() {
    try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
  }
  function saveRecent(code, label) {
    if (!code) return;
    let list = loadRecent().filter(r => r.code !== code);
    list.unshift({ code, label: label || code.slice(0, 8), t: Date.now() });
    list = list.slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    renderRecent();
  }
  function renderRecent() {
    const list = loadRecent();
    if (!list.length) { recentRoomsEl.classList.add("hidden"); return; }
    recentRoomsEl.classList.remove("hidden");
    recentListEl.innerHTML = list.map(r => `
      <div class="recent-item">
        <code title="${r.code}">${r.code.length > 16 ? r.code.slice(0, 14) + "…" : r.code}</code>
        <button type="button" class="btn tiny" data-code="${r.code}">Liitu</button>
      </div>
    `).join("");
    recentListEl.querySelectorAll("button").forEach(btn => {
      btn.onclick = () => {
        joinCodeInput.value = btn.dataset.code;
        joinRoom();
      };
    });
  }
  renderRecent();

  // Cars
  const CARS = [
    { id: "speedy", name: "Speedy", color: "#ffcc33", maxSpeed: 7.4, accel: 0.19, turn: 0.048, hp: 3, desc: "Kiire, tasakaalus" },
    { id: "tank", name: "Tank", color: "#ff5b6e", maxSpeed: 6.2, accel: 0.14, turn: 0.042, hp: 5, desc: "Aeglane, 5 elu" },
    { id: "drifter", name: "Drifter", color: "#5b8cff", maxSpeed: 6.9, accel: 0.16, turn: 0.068, hp: 3, desc: "Parim juhtimine" },
    { id: "rocket", name: "Rocket", color: "#c77dff", maxSpeed: 7.8, accel: 0.22, turn: 0.040, hp: 2, desc: "Max kiirus" },
  ];
  let selectedCar = CARS[0];

  function buildCarGrid() {
    carGrid.innerHTML = "";
    CARS.forEach((c) => {
      const card = document.createElement("div");
      card.className = "car-card" + (c === selectedCar ? " selected" : "");
      card.innerHTML = `<div class="car-preview" style="background:${c.color}"></div><h3>${c.name}</h3><div class="car-stats">${c.desc}<br>${"❤️".repeat(c.hp)}</div>`;
      card.onclick = () => {
        carGrid.querySelectorAll(".car-card").forEach(x => x.classList.remove("selected"));
        card.classList.add("selected");
        selectedCar = c;
      };
      carGrid.appendChild(card);
    });
  }
  buildCarGrid();

  const MAPS = [
    { id: "classic", name: "Klassikaline", desc: "Roheline", emoji: "🏁", bg: "#2d5a27", trackColor: "#555", innerColor: "#2d5a27", decorColor: "#1e3d1a", type: "oval", friction: 0.97 },
    { id: "desert", name: "Kõrb", desc: "Libe", emoji: "🏜️", bg: "#c2a15a", trackColor: "#8b6914", innerColor: "#d4b86a", decorColor: "#a07830", type: "oval", friction: 0.935, outerScale: 0.44 },
    { id: "ice", name: "Jää", desc: "Väga libe", emoji: "❄️", bg: "#a8d5e5", trackColor: "#e8f4f8", innerColor: "#7eb8d4", decorColor: "#fff", type: "oval", friction: 0.90, outerScale: 0.40 },
    { id: "night", name: "Öö", desc: "Neon", emoji: "🌙", bg: "#0d1b2a", trackColor: "#1b263b", innerColor: "#0d1b2a", decorColor: "#415a77", type: "oval", friction: 0.97, neon: true },
    { id: "figure8", name: "Kaheksa", desc: "Ristuvad", emoji: "8️⃣", bg: "#3d5a3d", trackColor: "#4a4a4a", innerColor: "#3d5a3d", decorColor: "#2a3d2a", type: "figure8", friction: 0.96 },
  ];
  let selectedMap = null, currentMap = MAPS[0];

  function buildMapGrid(container, onSelect) {
    container.innerHTML = "";
    MAPS.forEach((m) => {
      const card = document.createElement("div");
      card.className = "map-card";
      card.innerHTML = `<div class="preview" style="background:${m.bg}">${m.emoji}</div><h3>${m.name}</h3><small>${m.desc}</small>`;
      card.onclick = () => {
        container.querySelectorAll(".map-card").forEach(c => c.classList.remove("selected"));
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
  buildMapGrid(lobbyMapGrid, (m) => { if (isHost && socket) socket.emit("setMap", { mapId: m.id }); });

  const track = { cx: 0, cy: 0, outerA: 0, outerB: 0, innerA: 0, innerB: 0 };
  function setupTrack() {
    track.cx = W / 2; track.cy = H / 2;
    const scale = currentMap.outerScale || 0.42;
    track.outerA = Math.min(W, H) * scale;
    track.outerB = Math.min(W, H) * (scale * 0.76);
    track.innerA = track.outerA * 0.55;
    track.innerB = track.outerB * 0.55;
  }
  function onTrack(x, y) {
    if (currentMap.type === "figure8") {
      const leftCx = track.cx - track.outerA * 0.35, rightCx = track.cx + track.outerA * 0.35;
      const a = track.outerA * 0.55, b = track.outerB * 0.9, ia = a * 0.5, ib = b * 0.5;
      const inRing = (cx, cy, oa, ob, iaa, ibb) => {
        const dx = (x-cx)/oa, dy = (y-cy)/ob;
        return dx*dx+dy*dy <= 1 && ((x-cx)/iaa)**2 + ((y-cy)/ibb)**2 >= 1;
      };
      return inRing(leftCx, track.cy, a, b, ia, ib) || inRing(rightCx, track.cy, a, b, ia, ib);
    }
    const dx = (x-track.cx)/track.outerA, dy = (y-track.cy)/track.outerB;
    return dx*dx+dy*dy <= 1 && ((x-track.cx)/track.innerA)**2 + ((y-track.cy)/track.innerB)**2 >= 1;
  }
  function trackAngle(x, y) { return Math.atan2(y - track.cy, x - track.cx); }

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

  const skids = [];
  function addSkid(x, y, angle) {
    if (skids.length > 200) skids.shift();
    skids.push({ x, y, angle, life: 1.6 });
  }

  class ItemBox {
    constructor(x, y, id) {
      this.id = id; this.x = x; this.y = y; this.baseY = y;
      this.phase = Math.random() * Math.PI * 2;
      this.alive = true; this.respawn = 0; this.size = 17;
    }
    update(dt) {
      this.phase += dt * 3.2;
      this.y = this.baseY + Math.sin(this.phase) * 5;
      if (!this.alive) { this.respawn -= dt; if (this.respawn <= 0) this.alive = true; }
    }
    draw(ctx) {
      if (!this.alive) return;
      const s = this.size + Math.sin(this.phase * 2) * 2;
      ctx.fillStyle = "rgba(255,220,50,0.28)";
      ctx.beginPath(); ctx.arc(this.x, this.y, s + 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#ffcc33"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.phase * 0.4);
      roundRect(ctx, -s/2, -s/2, s, s, 4); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#1a1a2e"; ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 0, 1);
      ctx.restore();
    }
  }

  class Rocket {
    constructor(x, y, angle, ownerId) {
      this.x = x; this.y = y; this.angle = angle;
      this.speed = 12.5; this.ownerId = ownerId;
      this.life = 2.5; this.homing = 0.05; this.alive = true;
    }
    update(dt, cars) {
      this.life -= dt;
      if (this.life <= 0) { this.alive = false; return; }
      let best = null, bestDist = 330;
      for (const c of cars) {
        if (c.id === this.ownerId || !c.alive || c.shield > 0) continue;
        const dx = c.x - this.x, dy = c.y - this.y, dist = Math.hypot(dx, dy);
        if (dist < bestDist) {
          let da = Math.atan2(dy, dx) - this.angle;
          while (da > Math.PI) da -= Math.PI * 2;
          while (da < -Math.PI) da += Math.PI * 2;
          if (Math.abs(da) < 1.4) { best = c; bestDist = dist; }
        }
      }
      if (best) {
        let da = Math.atan2(best.y - this.y, best.x - this.x) - this.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        this.angle += da * this.homing;
      }
      this.x += Math.cos(this.angle) * this.speed;
      this.y += Math.sin(this.angle) * this.speed;
      for (const c of cars) {
        if (c.id === this.ownerId || !c.alive) continue;
        if (Math.hypot(c.x - this.x, c.y - this.y) < 17) {
          if (c.shield > 0) { c.shield = 0; this.alive = false; spawnExplosion(this.x, this.y, "#5dffa8"); }
          else { c.takeDamage(); this.alive = false; spawnExplosion(this.x, this.y); sfx.hit(); }
          break;
        }
      }
      if (this.x < -80 || this.x > W+80 || this.y < -80 || this.y > H+80) this.alive = false;
    }
    draw(ctx) {
      ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.angle);
      ctx.strokeStyle = "rgba(255,90,30,0.6)"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-14,0); ctx.lineTo(-2,0); ctx.stroke();
      ctx.fillStyle = "#ff5b6e";
      ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(-6,-4); ctx.lineTo(-6,4); ctx.closePath(); ctx.fill();
      ctx.fillStyle = "#ffcc33";
      ctx.beginPath(); ctx.moveTo(10,0); ctx.lineTo(4,-2.5); ctx.lineTo(4,2.5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  class Mine {
    constructor(x, y, ownerId) {
      this.x = x; this.y = y; this.ownerId = ownerId;
      this.life = 11; this.alive = true; this.radius = 11;
    }
    update(dt, cars) {
      this.life -= dt;
      if (this.life <= 0) { this.alive = false; return; }
      for (const c of cars) {
        if (c.id === this.ownerId || !c.alive) continue;
        if (Math.hypot(c.x - this.x, c.y - this.y) < 19) {
          if (c.shield > 0) { c.shield = 0; this.alive = false; }
          else { c.takeDamage(); this.alive = false; spawnExplosion(this.x, this.y); sfx.hit(); }
          break;
        }
      }
    }
    draw(ctx) {
      ctx.fillStyle = "#222";
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = this.life < 2.5 ? "#ff0000" : "#ff9900";
      ctx.beginPath(); ctx.arc(this.x, this.y, 4.5, 0, Math.PI*2); ctx.fill();
    }
  }

  class OilSlick {
    constructor(x, y) {
      this.x = x; this.y = y; this.life = 7; this.alive = true; this.radius = 26;
    }
    update(dt, cars) {
      this.life -= dt;
      if (this.life <= 0) { this.alive = false; return; }
      for (const c of cars) {
        if (!c.alive || c.shield > 0) continue;
        if (Math.hypot(c.x - this.x, c.y - this.y) < this.radius) {
          c.angle += (Math.random()-0.5)*0.14;
          c.speed *= 0.92;
        }
      }
    }
    draw(ctx) {
      ctx.fillStyle = `rgba(35,15,55,${0.45*Math.min(1,this.life)})`;
      ctx.beginPath(); ctx.ellipse(this.x, this.y, this.radius, this.radius*0.55, 0.2, 0, Math.PI*2); ctx.fill();
    }
  }

  class Car {
    constructor(x, y, angle, carDef, id, name, isLocal = false, isAI = false) {
      this.id = id;
      this.x = x; this.y = y; this.angle = angle;
      this.vx = 0; this.vy = 0; this.speed = 0;
      this.def = carDef;
      this.maxSpeed = isAI ? carDef.maxSpeed * 0.82 : carDef.maxSpeed;
      this.accel = isAI ? carDef.accel * 0.75 : carDef.accel;
      this.turnSpeed = isAI ? carDef.turn * 0.75 : carDef.turn;
      this.friction = currentMap.friction;
      this.color = carDef.color;
      this.hp = carDef.hp;
      this.maxHp = carDef.hp;
      this.isLocal = isLocal;
      this.isAI = isAI;
      this.name = name;
      this.w = 28; this.h = 16;
      this.lap = 0; this.progress = 0; this.lastAngle = angle;
      this.power = null;
      this.boostTimer = 0; this.shield = 0;
      this.hitFlash = 0; this.alive = true; this.respawnTimer = 0;
      this.aiTarget = 0; this.aiTimer = 0; this.aiFireTimer = 1 + Math.random()*2;
      this.targetX = x; this.targetY = y; this.targetAngle = angle;
      this.skidCooldown = 0;
      this.drifting = false;
    }
    takeDamage() {
      if (this.shield > 0) { this.shield = 0; return; }
      this.hp--;
      this.hitFlash = 0.45;
      this.speed *= 0.35;
      if (this.isLocal) updateHpHud();
      if (this.hp <= 0) {
        this.alive = false;
        this.respawnTimer = 1.6;
        this.power = null;
        if (this.isLocal) powerNameEl.textContent = "–";
        spawnExplosion(this.x, this.y);
      }
    }
    update(dt, rockets, mines, oils, boxes) {
      if (!this.alive) {
        this.respawnTimer -= dt;
        if (this.respawnTimer <= 0) this.respawn();
        return;
      }
      if (this.hitFlash > 0) this.hitFlash -= dt;
      if (this.boostTimer > 0) this.boostTimer -= dt;
      if (this.shield > 0) this.shield -= dt;
      if (this.skidCooldown > 0) this.skidCooldown -= dt;

      if (!this.isLocal && !this.isAI) {
        this.x += (this.targetX - this.x) * Math.min(1, dt * 14);
        this.y += (this.targetY - this.y) * Math.min(1, dt * 14);
        let da = this.targetAngle - this.angle;
        while (da > Math.PI) da -= Math.PI * 2;
        while (da < -Math.PI) da += Math.PI * 2;
        this.angle += da * Math.min(1, dt * 14);
        return;
      }

      let accel = 0, turn = 0, usePower = false, drift = false;
      if (this.isLocal) {
        if (keys["ArrowUp"] || keys["KeyW"] || touch.forward) accel = 1;
        if (keys["ArrowDown"] || keys["KeyS"] || touch.back) accel = -0.5;
        if (keys["ArrowLeft"] || keys["KeyA"] || touch.left) turn = -1;
        if (keys["ArrowRight"] || keys["KeyD"] || touch.right) turn = 1;
        if (touch.ax !== 0 || touch.ay !== 0) {
          turn = touch.ax;
          if (touch.ay < -0.2) accel = 1;
          if (touch.ay > 0.35) accel = -0.45;
        }
        if (keys["Space"] || touch.fire) usePower = true;
        if (keys["ShiftLeft"] || keys["ShiftRight"] || touch.drift) drift = true;
      } else if (this.isAI) {
        this.aiTimer -= dt;
        if (this.aiTimer <= 0) {
          this.aiTarget = trackAngle(this.x, this.y) + Math.PI/2 + (Math.random()-0.5)*0.4;
          this.aiTimer = 0.28 + Math.random()*0.4;
        }
        let da = this.aiTarget - this.angle;
        while (da > Math.PI) da -= Math.PI*2;
        while (da < -Math.PI) da += Math.PI*2;
        turn = Math.max(-1, Math.min(1, da * 3));
        accel = 1;
        if (Math.abs(da) > 0.6) drift = true;
        this.aiFireTimer -= dt;
        if (this.power && this.aiFireTimer <= 0) { usePower = true; this.aiFireTimer = 1.3 + Math.random()*2; }
      }

      this.drifting = drift && Math.abs(this.speed) > 2.5;
      const boostMult = this.boostTimer > 0 ? 1.55 : 1;
      const driftTurn = this.drifting ? 1.55 : 1;
      const driftFriction = this.drifting ? 0.985 : this.friction;

      if (accel > 0) this.speed += this.accel * accel * boostMult;
      else if (accel < 0) this.speed += this.accel * accel * 1.35;
      this.speed *= driftFriction;
      this.speed = Math.max(-this.maxSpeed * 0.3, Math.min(this.maxSpeed * boostMult, this.speed));

      if (Math.abs(this.speed) > 0.25) {
        this.angle += turn * this.turnSpeed * driftTurn * (this.speed > 0 ? 1 : -1);
        if ((this.drifting || Math.abs(turn) > 0.7) && Math.abs(this.speed) > 3.2 && this.skidCooldown <= 0) {
          addSkid(this.x, this.y, this.angle);
          this.skidCooldown = 0.035;
          if (this.drifting && this.isLocal && Math.random() < 0.08) sfx.drift();
        }
      }

      this.vx = Math.cos(this.angle) * this.speed;
      this.vy = Math.sin(this.angle) * this.speed;
      let nx = this.x + this.vx, ny = this.y + this.vy;
      if (!onTrack(nx, ny)) {
        const ang = Math.atan2(this.y - track.cy, this.x - track.cx);
        const midA = (track.outerA + track.innerA) / 2;
        const midB = (track.outerB + track.innerB) / 2;
        this.vx += (track.cx + Math.cos(ang)*midA - this.x) * 0.07;
        this.vy += (track.cy + Math.sin(ang)*midB - this.y) * 0.07;
        this.speed *= 0.6;
        nx = this.x + this.vx; ny = this.y + this.vy;
      }
      this.x = nx; this.y = ny;

      let ang = trackAngle(this.x, this.y);
      let dAng = ang - this.lastAngle;
      if (dAng > Math.PI) dAng -= Math.PI*2;
      if (dAng < -Math.PI) dAng += Math.PI*2;
      this.progress += dAng;
      this.lastAngle = ang;
      const fullLaps = Math.floor(this.progress / (Math.PI*2));
      if (fullLaps > this.lap && this.x > track.cx - 40) {
        this.lap = fullLaps;
        if (this.isLocal && this.lap >= 3) endRace(true);
      }

      for (const box of boxes) {
        if (!box.alive) continue;
        if (Math.hypot(box.x - this.x, box.y - this.y) < 24) {
          box.alive = false;
          box.respawn = 4.5 + Math.random()*2.5;
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
      if (usePower && this.power) this.activatePower(rockets, mines, oils);
      if (this.isLocal) {
        nitroBar.style.width = (this.boostTimer > 0 ? Math.min(100, this.boostTimer / 1.9 * 100) : 0) + "%";
      }
    }
    activatePower(rockets, mines, oils) {
      const p = this.power;
      this.power = null;
      if (this.isLocal) powerNameEl.textContent = "–";
      if (p.id === "rocket") {
        const ox = this.x + Math.cos(this.angle)*24, oy = this.y + Math.sin(this.angle)*24;
        rockets.push(new Rocket(ox, oy, this.angle, this.id));
        if (this.isLocal) { showMsg("Rakett!"); sfx.rocket(); }
        if (isMulti) broadcast({ type: "rocket", x: ox, y: oy, angle: this.angle, ownerId: this.id });
      } else if (p.id === "boost") {
        this.boostTimer = 1.9;
        if (this.isLocal) { showMsg("Nitro!"); sfx.boost(); }
        if (isMulti) broadcast({ type: "boost", playerId: this.id });
      } else if (p.id === "shield") {
        this.shield = 5;
        if (this.isLocal) showMsg("Kilp!");
        if (isMulti) broadcast({ type: "shield", playerId: this.id });
      } else if (p.id === "mine") {
        const mx = this.x - Math.cos(this.angle)*32, my = this.y - Math.sin(this.angle)*32;
        mines.push(new Mine(mx, my, this.id));
        if (this.isLocal) showMsg("Miin!");
        if (isMulti) broadcast({ type: "mine", x: mx, y: my, ownerId: this.id });
      } else if (p.id === "oil") {
        const ox = this.x - Math.cos(this.angle)*36, oy = this.y - Math.sin(this.angle)*36;
        oils.push(new OilSlick(ox, oy));
        if (this.isLocal) showMsg("Õli!");
        if (isMulti) broadcast({ type: "oil", x: ox, y: oy });
      }
    }
    respawn() {
      this.alive = true;
      this.hp = this.maxHp;
      if (this.isLocal) updateHpHud();
      const ang = this.lastAngle;
      const midA = (track.outerA + track.innerA) / 2;
      const midB = (track.outerB + track.innerB) / 2;
      this.x = track.cx + Math.cos(ang)*midA;
      this.y = track.cy + Math.sin(ang)*midB;
      this.angle = ang + Math.PI/2;
      this.speed = 0; this.vx = 0; this.vy = 0;
    }
    applyRemoteState(s) {
      this.targetX = s.x; this.targetY = s.y; this.targetAngle = s.angle;
      this.speed = s.speed; this.lap = s.lap; this.progress = s.progress;
      this.boostTimer = s.boostTimer || 0; this.shield = s.shield || 0;
      this.alive = s.alive; this.hp = s.hp != null ? s.hp : this.hp;
      this.power = s.power ? POWER_TYPES.find(p => p.id === s.power) || null : null;
    }
    draw(ctx) {
      if (!this.alive && this.respawnTimer > 0.7) return;
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      if (this.shield > 0) {
        ctx.strokeStyle = `rgba(93,255,168,${0.35+Math.sin(Date.now()/90)*0.25})`;
        ctx.lineWidth = 4;
        ctx.beginPath(); ctx.arc(0, 0, 21, 0, Math.PI*2); ctx.stroke();
      }
      if (this.drifting) {
        ctx.strokeStyle = "rgba(100,200,255,0.35)";
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI*2); ctx.stroke();
      }
      ctx.fillStyle = "rgba(0,0,0,0.25)";
      ctx.beginPath(); ctx.ellipse(2, 3.5, this.w/2, this.h/2, 0, 0, Math.PI*2); ctx.fill();
      const flash = this.hitFlash > 0;
      ctx.fillStyle = flash ? "#fff" : this.color;
      ctx.strokeStyle = "#111"; ctx.lineWidth = 2;
      roundRect(ctx, -this.w/2, -this.h/2, this.w, this.h, 6);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = flash ? "#eee" : "#1a1a1a";
      roundRect(ctx, -5, -6.5, 13, 13, 3.5); ctx.fill();
      ctx.fillStyle = this.boostTimer > 0 ? "#00ffff" : "#ffe066";
      ctx.beginPath();
      ctx.arc(this.w/2-2, -4.5, 2.8, 0, Math.PI*2);
      ctx.arc(this.w/2-2, 4.5, 2.8, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = "#111";
      ctx.fillRect(-this.w/2+2, -this.h/2-2.5, 7, 3.5);
      ctx.fillRect(this.w/2-9, -this.h/2-2.5, 7, 3.5);
      ctx.fillRect(-this.w/2+2, this.h/2-1, 7, 3.5);
      ctx.fillRect(this.w/2-9, this.h/2-1, 7, 3.5);
      if (this.boostTimer > 0) {
        ctx.fillStyle = "#ff5500";
        ctx.beginPath();
        ctx.moveTo(-this.w/2, 0);
        ctx.lineTo(-this.w/2-11-Math.random()*6, -5);
        ctx.lineTo(-this.w/2-11-Math.random()*6, 5);
        ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      if (!this.isLocal) {
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(this.name, this.x, this.y - 22);
      }
    }
  }

  const particles = [];
  function spawnExplosion(x, y, col = null) {
    for (let i = 0; i < 16; i++) {
      const a = Math.random()*Math.PI*2, s = 2+Math.random()*5.5;
      particles.push({ x, y, vx: Math.cos(a)*s, vy: Math.sin(a)*s, life: 0.4+Math.random()*0.35, color: col||(Math.random()>0.45?"#ff6600":"#ffcc33"), size: 2.5+Math.random()*4 });
    }
  }
  function updateParticles(dt) {
    for (let i = particles.length-1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx; p.y += p.vy; p.vx *= 0.9; p.vy *= 0.9; p.life -= dt;
      if (p.life <= 0) particles.splice(i, 1);
    }
  }
  function drawParticles(ctx) {
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life*2);
      ctx.fillStyle = p.color;
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size*p.life*2, 0, Math.PI*2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath();
  }
  function showMsg(t) {
    msgEl.textContent = t;
    clearTimeout(showMsg._t);
    showMsg._t = setTimeout(() => msgEl.textContent = "", 900);
  }
  function updateHpHud() {
    if (!player) return;
    hpHeartsEl.textContent = "❤️".repeat(Math.max(0, player.hp)) + "🖤".repeat(Math.max(0, player.maxHp - player.hp));
  }

  const keys = {};
  const touch = { ax:0, ay:0, forward:false, back:false, left:false, right:false, fire:false, drift:false };
  window.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space","ShiftLeft","ShiftRight"].includes(e.code)) e.preventDefault();
    ensureAudio();
  });
  window.addEventListener("keyup", e => keys[e.code] = false);

  let stickActive = false;
  function handleStick(cx, cy) {
    const rect = stickZone.getBoundingClientRect();
    const mx = rect.left + rect.width/2, my = rect.top + rect.height/2;
    let dx = cx - mx, dy = cy - my;
    const max = 36, len = Math.hypot(dx, dy);
    if (len > max) { dx = dx/len*max; dy = dy/len*max; }
    stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    touch.ax = dx/max; touch.ay = dy/max;
  }
  function resetStick() {
    stickActive = false;
    stickKnob.style.transform = "translate(-50%,-50%)";
    touch.ax = 0; touch.ay = 0;
  }
  stickZone.addEventListener("touchstart", e => { e.preventDefault(); stickActive=true; handleStick(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
  stickZone.addEventListener("touchmove", e => { e.preventDefault(); if(stickActive) handleStick(e.touches[0].clientX, e.touches[0].clientY); }, {passive:false});
  stickZone.addEventListener("touchend", resetStick);
  stickZone.addEventListener("touchcancel", resetStick);
  btnFire.addEventListener("touchstart", e => { e.preventDefault(); touch.fire=true; }, {passive:false});
  btnFire.addEventListener("touchend", () => touch.fire=false);
  btnDrift.addEventListener("touchstart", e => { e.preventDefault(); touch.drift=true; }, {passive:false});
  btnDrift.addEventListener("touchend", () => touch.drift=false);


  // ========== MULTIPLAYER (Socket.IO server) ==========
  let socket = null;
  let isHost = false;
  let isMulti = false;
  let myPeerId = null; // socket.id
  let remotePlayers = {};
  let localPlayerName = "Mängija";
  let currentRoomCode = null;
  const playerColors = ["#ffcc33","#ff5b6e","#5b8cff","#5dffa8","#c77dff","#f4a261"];

  const roomListEl = document.getElementById("room-list");
  const btnRefreshRooms = document.getElementById("btn-refresh-rooms");
  const roomNameInput = document.getElementById("room-name");
  const chkPublic = document.getElementById("chk-public");

  function getName() { return (playerNameInput.value.trim()||"Mängija").slice(0,12); }
  function setStatus(t, isErr) {
    lobbyStatus.textContent = t || "";
    lobbyStatus.classList.toggle("error", !!isErr);
  }

  function ensureSocket() {
    if (socket && socket.connected) return socket;
    if (socket) { try { socket.disconnect(); } catch(e) {} }
    socket = io({ transports: ["websocket", "polling"] });
    socket.on("connect", () => {
      myPeerId = socket.id;
      setStatus("Serveriga ühendatud");
    });
    socket.on("disconnect", () => setStatus("Ühendus katkes", true));
    socket.on("rooms", renderRoomList);
    socket.on("room", onRoomUpdate);
    socket.on("start", onRaceStart);
    socket.on("game", onGameEvent);
    socket.on("playerLeft", (d) => {
      cars = cars.filter(c => c.id !== d.id);
      delete remotePlayers[d.id];
      updatePlayerListFromRoom();
    });
    return socket;
  }

  function renderRoomList(list) {
    if (!roomListEl) return;
    if (!list || !list.length) {
      roomListEl.innerHTML = '<div class="muted-line">Praegu avalikke tube pole – loo ise!</div>';
      return;
    }
    roomListEl.innerHTML = list.map(r => `
      <div class="room-row">
        <div>
          <div class="title">${escapeHtml(r.name || r.code)}</div>
          <div class="meta">${escapeHtml(r.hostName || "?")} · ${r.players}/${r.maxPlayers}${r.racing ? " · mäng käib" : ""} · ${r.code}</div>
        </div>
        <button type="button" class="btn tiny" data-code="${r.code}" ${r.racing || r.players >= r.maxPlayers ? "disabled" : ""}>Liitu</button>
      </div>
    `).join("");
    roomListEl.querySelectorAll("button[data-code]").forEach(btn => {
      btn.onclick = () => {
        joinCodeInput.value = btn.dataset.code;
        joinRoom();
      };
    });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  function onRoomUpdate(room) {
    if (!room) return;
    currentRoomCode = room.code;
    isHost = room.hostId === myPeerId;
    remotePlayers = {};
    (room.players || []).forEach(p => {
      if (p.id !== myPeerId) remotePlayers[p.id] = { name: p.name, color: p.color };
    });
    roomCodeDisplay.textContent = room.code;
    lobbyCreate.classList.add("hidden");
    lobbyRoom.classList.remove("hidden");
    updatePlayerListFromRoom(room);
    if (room.mapId) {
      selectedMap = MAPS.find(m => m.id === room.mapId) || selectedMap;
      lobbyMapGrid.querySelectorAll(".map-card").forEach((c, i) => {
        c.classList.toggle("selected", MAPS[i].id === room.mapId);
      });
    }
    setStatus(isHost ? "Oled host – vali rada ja alusta" : "Ootad hosti…");
  }

  function updatePlayerListFromRoom(room) {
    const players = room ? room.players : [
      { id: myPeerId, name: localPlayerName, color: "#ffcc33", host: isHost },
      ...Object.entries(remotePlayers).map(([id, p]) => ({ id, name: p.name, color: p.color }))
    ];
    playerListEl.innerHTML = players.map(p =>
      `<div class="pl"><span class="pl-dot" style="background:${p.color||"#5b8cff"}"></span><span>${escapeHtml(p.name)}${p.host || p.id===myPeerId && isHost ? " · host" : ""}</span></div>`
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
  }

  function onRaceStart(msg) {
    currentMap = MAPS.find(m => m.id === msg.mapId) || MAPS[0];
    selectedMap = currentMap;
    startMultiRace(msg.players || []);
  }

  function onGameEvent(payload) {
    if (!payload || payload.from === myPeerId) return;
    const msg = payload;
    switch (msg.type) {
      case "state": {
        const car = cars.find(c => c.id === msg.id);
        if (car && !car.isLocal) car.applyRemoteState(msg);
        break;
      }
      case "rocket": rockets.push(new Rocket(msg.x, msg.y, msg.angle, msg.ownerId)); break;
      case "mine": mines.push(new Mine(msg.x, msg.y, msg.ownerId)); break;
      case "oil": oils.push(new OilSlick(msg.x, msg.y)); break;
      case "boost": { const c = cars.find(c => c.id===msg.playerId); if(c) c.boostTimer=1.9; break; }
      case "shield": { const c = cars.find(c => c.id===msg.playerId); if(c) c.shield=5; break; }
      case "boxTaken": { const b = boxes.find(b => b.id===msg.boxId); if(b){ b.alive=false; b.respawn=5; } break; }
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
    const payload = {
      playerName: localPlayerName,
      roomName: (roomNameInput && roomNameInput.value.trim()) || (localPlayerName + " tuba"),
      public: !chkPublic || chkPublic.checked,
      color: "#ffcc33",
    };
    socket.emit("createRoom", payload, (res) => {
      if (!res || !res.ok) {
        setStatus((res && res.error) || "Tubade loomine ebaõnnestus", true);
        return;
      }
      isMulti = true;
      isHost = true;
      myPeerId = socket.id;
      onRoomUpdate(res.room);
      saveRecent(res.room.code, res.room.name);
    });
  }

  function joinRoom() {
    localPlayerName = getName();
    const code = joinCodeInput.value.trim().toUpperCase();
    if (!code) { setStatus("Sisesta toa kood", true); return; }
    ensureSocket();
    setStatus("Liitun…");
    socket.emit("joinRoom", {
      code,
      playerName: localPlayerName,
      color: playerColors[Math.floor(Math.random()*playerColors.length)],
    }, (res) => {
      if (!res || !res.ok) {
        setStatus((res && res.error) || "Liitumine ebaõnnestus", true);
        return;
      }
      isMulti = true;
      isHost = res.room.hostId === socket.id;
      myPeerId = socket.id;
      onRoomUpdate(res.room);
      saveRecent(res.room.code, res.room.name);
    });
  }

  function leaveServerRoom() {
    if (socket) {
      socket.emit("leaveRoom");
    }
    isHost = false;
    isMulti = false;
    currentRoomCode = null;
    remotePlayers = {};
  }

  if (btnRefreshRooms) {
    btnRefreshRooms.onclick = () => {
      ensureSocket();
      socket.emit("listRooms");
    };
  }


  let cars=[], rockets=[], mines=[], oils=[], boxes=[];
  let player=null, running=false, lastTime=0, raceEnded=false, syncTimer=0;
  let camX=0, camY=0;
  const aiNames = ["Speedy","Turbo","Zoom","Bolt","Flash"];

  function spawnBoxes() {
    boxes = [];
    const n = currentMap.type==="figure8" ? 8 : 6;
    for (let i=0; i<n; i++) {
      const a = (i/n)*Math.PI*2 + 0.3;
      const midA = (track.outerA+track.innerA)/2, midB = (track.outerB+track.innerB)/2;
      boxes.push(new ItemBox(track.cx+Math.cos(a)*midA, track.cy+Math.sin(a)*midB, "box"+i));
    }
  }

  function doCountdown(cb) {
    countdownEl.classList.remove("hidden");
    let n = 3; countdownEl.textContent = n; sfx.count();
    const iv = setInterval(() => {
      n--;
      if (n > 0) { countdownEl.textContent = n; sfx.count(); }
      else if (n === 0) { countdownEl.textContent = "GO!"; sfx.go(); }
      else { clearInterval(iv); countdownEl.classList.add("hidden"); cb(); }
    }, 700);
  }

  function startSingleRace() {
    if (!selectedMap) return;
    isMulti = false; currentMap = selectedMap; setupTrack();
    cars=[]; rockets=[]; mines=[]; oils=[]; skids.length=0; particles.length=0;
    raceEnded=false;
    endScreen.classList.add("hidden"); startScreen.classList.add("hidden");
    carScreen.classList.add("hidden"); menuScreen.classList.add("hidden");
    hud.classList.remove("hidden"); minimap.classList.remove("hidden");
    if (isTouch) touchControls.classList.remove("hidden");

    const startAng=0, midA=(track.outerA+track.innerA)/2, midB=(track.outerB+track.innerB)/2;
    player = new Car(track.cx+Math.cos(startAng)*midA, track.cy+Math.sin(startAng)*midB+14,
      startAng+Math.PI/2, selectedCar, "local", getName(), true, false);
    cars.push(player);
    for (let i=0; i<4; i++) {
      const def = CARS[i % CARS.length];
      const c = new Car(
        track.cx+Math.cos(startAng)*midA-(i%2)*10,
        track.cy+Math.sin(startAng)*midB + ((i+1)*22-32),
        startAng+Math.PI/2, def, "ai"+i, aiNames[i], false, true
      );
      c.progress = -0.06*(i+1);
      cars.push(c);
    }
    spawnBoxes();
    powerNameEl.textContent="–"; lapEl.textContent="1"; posEl.textContent="1";
    playersOnlineEl.textContent=""; updateHpHud();
    camX=player.x; camY=player.y;
    doCountdown(() => { running=true; lastTime=performance.now(); requestAnimationFrame(loop); });
  }

  function startMultiRace(playerInfo) {
    currentMap = selectedMap || MAPS[0]; setupTrack();
    cars=[]; rockets=[]; mines=[]; oils=[]; skids.length=0; particles.length=0;
    raceEnded=false;
    lobbyScreen.classList.add("hidden"); menuScreen.classList.add("hidden");
    endScreen.classList.add("hidden");
    hud.classList.remove("hidden"); minimap.classList.remove("hidden");
    if (isTouch) touchControls.classList.remove("hidden");

    const startAng=0, midA=(track.outerA+track.innerA)/2, midB=(track.outerB+track.innerB)/2;
    const all = playerInfo || [];
    if (!all.find(p => p.id===myPeerId)) all.unshift({ id:myPeerId, name:localPlayerName, color:"#ffcc33" });

    all.forEach((p, i) => {
      const isLocal = p.id === myPeerId;
      const def = isLocal ? selectedCar : CARS[i % CARS.length];
      const c = new Car(
        track.cx+Math.cos(startAng)*midA,
        track.cy+Math.sin(startAng)*midB + (i-(all.length-1)/2)*24,
        startAng+Math.PI/2, def, p.id, p.name, isLocal, false
      );
      if (!isLocal) c.color = p.color || def.color;
      cars.push(c);
      if (isLocal) player = c;
    });
    spawnBoxes();
    powerNameEl.textContent="–"; lapEl.textContent="1"; posEl.textContent="1";
    playersOnlineEl.textContent = cars.length + " mängijat"; updateHpHud();
    camX=player.x; camY=player.y;
    doCountdown(() => { running=true; lastTime=performance.now(); requestAnimationFrame(loop); });
  }

  function endRace(won) {
    if (raceEnded) return;
    raceEnded=true; running=false;
    hud.classList.add("hidden"); minimap.classList.add("hidden"); touchControls.classList.add("hidden");
    endScreen.classList.remove("hidden");
    const sorted = [...cars].sort((a,b)=>b.progress-a.progress);
    standingsEl.innerHTML = sorted.map((c,i) =>
      `<div class="place${c===player?" me":""}"><span>${i+1}. ${c.name}</span><span>R${Math.min(3,c.lap+1)}</span></div>`
    ).join("");
    if (won) { endTitle.textContent = "Võitsid!"; endMsg.textContent = "Suurepärane sõit"; }
    else {
      const place = sorted.findIndex(c=>c===player)+1;
      endTitle.textContent = place<=3 ? `Koht #${place}` : "Finiš";
      endMsg.textContent = `Sinu koht: ${place}`;
    }
  }
  function getPosition() {
    return [...cars].sort((a,b)=>b.progress-a.progress).findIndex(c=>c===player)+1;
  }

  function drawTrack(ctx) {
    if (currentMap.type === "figure8") {
      const leftCx=track.cx-track.outerA*0.35, rightCx=track.cx+track.outerA*0.35;
      const a=track.outerA*0.55, b=track.outerB*0.9, ia=a*0.5, ib=b*0.5;
      ctx.fillStyle=currentMap.trackColor;
      ctx.beginPath(); ctx.ellipse(leftCx,track.cy,a,b,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(rightCx,track.cy,a,b,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=currentMap.innerColor;
      ctx.beginPath(); ctx.ellipse(leftCx,track.cy,ia,ib,0,0,Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(rightCx,track.cy,ia,ib,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=currentMap.neon?"#00f5ff":"#fff"; ctx.lineWidth=2; ctx.setLineDash([12,10]);
      ctx.beginPath(); ctx.ellipse(leftCx,track.cy,(a+ia)/2,(b+ib)/2,0,0,Math.PI*2); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(rightCx,track.cy,(a+ia)/2,(b+ib)/2,0,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
    } else {
      ctx.fillStyle=currentMap.trackColor;
      ctx.beginPath(); ctx.ellipse(track.cx,track.cy,track.outerA,track.outerB,0,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=currentMap.innerColor;
      ctx.beginPath(); ctx.ellipse(track.cx,track.cy,track.innerA,track.innerB,0,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle=currentMap.neon?"#00f5ff":"#fff"; ctx.lineWidth=3; ctx.setLineDash([14,11]);
      const midA=(track.outerA+track.innerA)/2, midB=(track.outerB+track.innerB)/2;
      ctx.beginPath(); ctx.ellipse(track.cx,track.cy,midA,midB,0,0,Math.PI*2); ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle="#fff"; ctx.lineWidth=5;
      const sx=track.cx+midA;
      ctx.beginPath(); ctx.moveTo(sx,track.cy-28); ctx.lineTo(sx,track.cy+28); ctx.stroke();
      ctx.fillStyle="#111";
      for(let i=0;i<5;i++) if(i%2===0) ctx.fillRect(sx-3,track.cy-28+i*11,6,11);
    }
  }
  function drawDecor(ctx) {
    ctx.fillStyle=currentMap.decorColor;
    const n=currentMap.type==="figure8"?16:22;
    for(let i=0;i<n;i++){
      const a=(i/n)*Math.PI*2+0.1, r=track.outerA+36+(i%3)*13;
      const x=track.cx+Math.cos(a)*r, y=track.cy+Math.sin(a)*(track.outerB+30+(i%4)*8);
      ctx.beginPath(); ctx.arc(x,y,9+(i%4),0,Math.PI*2); ctx.fill();
    }
  }
  function drawMinimap() {
    const mw=minimap.width, mh=minimap.height;
    mctx.fillStyle=currentMap.bg; mctx.fillRect(0,0,mw,mh);
    const scale=Math.min(mw/(track.outerA*2.4), mh/(track.outerB*2.4));
    mctx.save(); mctx.translate(mw/2,mh/2); mctx.scale(scale,scale); mctx.translate(-track.cx,-track.cy);
    mctx.fillStyle=currentMap.trackColor;
    mctx.beginPath(); mctx.ellipse(track.cx,track.cy,track.outerA,track.outerB,0,0,Math.PI*2); mctx.fill();
    mctx.fillStyle=currentMap.innerColor;
    mctx.beginPath(); mctx.ellipse(track.cx,track.cy,track.innerA,track.innerB,0,0,Math.PI*2); mctx.fill();
    for(const c of cars){
      mctx.fillStyle=c.isLocal?"#ffcc33":c.color;
      mctx.beginPath(); mctx.arc(c.x,c.y,c.isLocal?8:5.5,0,Math.PI*2); mctx.fill();
    }
    mctx.restore();
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.033, (now-lastTime)/1000); lastTime=now;
    for (const c of cars) c.update(dt, rockets, mines, oils, boxes);
    for (let i=rockets.length-1;i>=0;i--) { rockets[i].update(dt,cars); if(!rockets[i].alive) rockets.splice(i,1); }
    for (let i=mines.length-1;i>=0;i--) { mines[i].update(dt,cars); if(!mines[i].alive) mines.splice(i,1); }
    for (let i=oils.length-1;i>=0;i--) { oils[i].update(dt,cars); if(!oils[i].alive) oils.splice(i,1); }
    for (const b of boxes) b.update(dt);
    for (let i=skids.length-1;i>=0;i--) { skids[i].life-=dt; if(skids[i].life<=0) skids.splice(i,1); }
    updateParticles(dt);

    if (isMulti && player) {
      syncTimer += dt;
      if (syncTimer > 0.05) {
        syncTimer = 0;
        broadcast({
          type:"state", id:player.id, x:player.x, y:player.y, angle:player.angle,
          speed:player.speed, lap:player.lap, progress:player.progress,
          boostTimer:player.boostTimer, shield:player.shield, alive:player.alive, hp:player.hp,
          power: player.power ? player.power.id : null
        });
      }
    }
    if (player) {
      lapEl.textContent = Math.min(3, player.lap+1);
      posEl.textContent = getPosition();
      camX += (player.x-camX)*0.08; camY += (player.y-camY)*0.08;
    }

    ctx.fillStyle = currentMap.bg; ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.translate(W/2, H/2); ctx.scale(1.12, 1.12); ctx.translate(-camX, -camY);
    drawDecor(ctx); drawTrack(ctx);
    for (const s of skids) {
      ctx.globalAlpha = Math.min(0.4, s.life*0.3);
      ctx.strokeStyle="#222"; ctx.lineWidth=3;
      ctx.beginPath();
      ctx.moveTo(s.x-Math.cos(s.angle)*4, s.y-Math.sin(s.angle)*4);
      ctx.lineTo(s.x+Math.cos(s.angle)*4, s.y+Math.sin(s.angle)*4);
      ctx.stroke();
    }
    ctx.globalAlpha=1;
    for (const o of oils) o.draw(ctx);
    for (const m of mines) m.draw(ctx);
    for (const b of boxes) b.draw(ctx);
    for (const r of rockets) r.draw(ctx);
    [...cars].sort((a,b)=>a.y-b.y).forEach(c => c.draw(ctx));
    drawParticles(ctx);
    ctx.restore();
    drawMinimap();
    requestAnimationFrame(loop);
  }

  // UI
  btnSingle.onclick = () => { ensureAudio(); menuScreen.classList.add("hidden"); carScreen.classList.remove("hidden"); };
  btnMulti.onclick = () => {
    ensureAudio(); menuScreen.classList.add("hidden");
    lobbyScreen.classList.remove("hidden"); lobbyCreate.classList.remove("hidden");
    lobbyRoom.classList.add("hidden"); setStatus("");
    renderRecent();
    ensureSocket();
    socket.emit("listRooms");
  };
  carNext.onclick = () => { carScreen.classList.add("hidden"); startScreen.classList.remove("hidden"); };
  carBack.onclick = () => { carScreen.classList.add("hidden"); menuScreen.classList.remove("hidden"); };
  mapBack.onclick = () => { startScreen.classList.add("hidden"); carScreen.classList.remove("hidden"); };
  lobbyBack.onclick = () => {
    leaveServerRoom();
    lobbyScreen.classList.add("hidden"); menuScreen.classList.remove("hidden");
  };
  btnCreateRoom.onclick = createRoom;
  btnJoinRoom.onclick = joinRoom;
  joinCodeInput.addEventListener("keydown", e => { if(e.key==="Enter") joinRoom(); });
  btnCopy.onclick = () => {
    navigator.clipboard.writeText(roomCodeDisplay.textContent).then(()=>setStatus("Kood kopeeritud")).catch(()=>{});
  };
  btnStartMp.onclick = () => {
    if (!isHost || !selectedMap) { setStatus("Vali enne rada", true); return; }
    if (!socket) return;
    socket.emit("startRace", { mapId: selectedMap.id });
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

  playerNameInput.value = "Mängija" + Math.floor(Math.random()*90+10);
  setupTrack();
})();
