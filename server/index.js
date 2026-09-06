/**
 * Toon Car Racer – multiplayer server
 * Rooms list + create/join + state relay via Socket.IO
 */
const path = require("path");
const http = require("http");
const express = require("express");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 3080;
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
  pingTimeout: 20000,
  pingInterval: 10000,
});

const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir));
app.get("/health", (_req, res) => res.json({ ok: true }));

/** @type {Map<string, Room>} */
const rooms = new Map();

function code() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function uniqueCode() {
  let c;
  do { c = code(); } while (rooms.has(c));
  return c;
}

function publicRoomList() {
  const list = [];
  for (const r of rooms.values()) {
    if (!r.public) continue;
    list.push({
      code: r.code,
      name: r.name,
      hostName: r.hostName,
      players: r.players.size,
      maxPlayers: r.maxPlayers,
      mapId: r.mapId,
      racing: r.racing,
      createdAt: r.createdAt,
    });
  }
  list.sort((a, b) => b.createdAt - a.createdAt);
  return list.slice(0, 40);
}

function broadcastRooms() {
  io.emit("rooms", publicRoomList());
}

class Room {
  constructor(code, hostId, hostName, opts = {}) {
    this.code = code;
    this.hostId = hostId;
    this.hostName = hostName;
    this.name = opts.name || `${hostName} tuba`;
    this.public = opts.public !== false;
    this.maxPlayers = Math.min(6, Math.max(2, opts.maxPlayers || 6));
    this.mapId = opts.mapId || "classic";
    this.players = new Map(); // socketId -> { id, name, color, ready }
    this.racing = false;
    this.createdAt = Date.now();
  }

  addPlayer(socket, name, color) {
    if (this.players.size >= this.maxPlayers) return false;
    this.players.set(socket.id, {
      id: socket.id,
      name: (name || "Mängija").slice(0, 12),
      color: color || "#ffcc33",
      ready: false,
    });
    socket.join(this.code);
    socket.data.roomCode = this.code;
    return true;
  }

  removePlayer(socketId) {
    this.players.delete(socketId);
    if (socketId === this.hostId) {
      const next = this.players.keys().next().value;
      if (next) {
        this.hostId = next;
        this.hostName = this.players.get(next).name;
      }
    }
  }

  playerList() {
    return [...this.players.values()].map((p) => ({
      id: p.id,
      name: p.name,
      color: p.color,
      host: p.id === this.hostId,
    }));
  }

  snapshot() {
    return {
      code: this.code,
      name: this.name,
      hostId: this.hostId,
      hostName: this.hostName,
      mapId: this.mapId,
      racing: this.racing,
      players: this.playerList(),
      public: this.public,
    };
  }
}

io.on("connection", (socket) => {
  socket.emit("rooms", publicRoomList());

  socket.on("createRoom", (data = {}, cb) => {
    try {
      const name = (data.playerName || "Mängija").slice(0, 12);
      const roomName = (data.roomName || `${name} tuba`).slice(0, 24);
      const isPublic = data.public !== false;
      const c = uniqueCode();
      const room = new Room(c, socket.id, name, {
        name: roomName,
        public: isPublic,
        mapId: data.mapId || "classic",
      });
      const color = data.color || "#ffcc33";
      room.addPlayer(socket, name, color);
      rooms.set(c, room);
      if (typeof cb === "function") cb({ ok: true, room: room.snapshot() });
      socket.emit("room", room.snapshot());
      broadcastRooms();
    } catch (e) {
      if (typeof cb === "function") cb({ ok: false, error: e.message });
    }
  });

  socket.on("joinRoom", (data = {}, cb) => {
    try {
      const c = String(data.code || "").trim().toUpperCase();
      const room = rooms.get(c);
      if (!room) {
        if (typeof cb === "function") cb({ ok: false, error: "Tuba ei leitud" });
        return;
      }
      if (room.racing) {
        if (typeof cb === "function") cb({ ok: false, error: "Võistlus juba käib" });
        return;
      }
      if (room.players.size >= room.maxPlayers) {
        if (typeof cb === "function") cb({ ok: false, error: "Tuba on täis" });
        return;
      }
      const name = (data.playerName || "Mängija").slice(0, 12);
      const color = data.color || "#5b8cff";
      if (!room.addPlayer(socket, name, color)) {
        if (typeof cb === "function") cb({ ok: false, error: "Ei saanud liituda" });
        return;
      }
      if (typeof cb === "function") cb({ ok: true, room: room.snapshot() });
      io.to(room.code).emit("room", room.snapshot());
      broadcastRooms();
    } catch (e) {
      if (typeof cb === "function") cb({ ok: false, error: e.message });
    }
  });

  socket.on("leaveRoom", () => leave(socket));

  socket.on("setMap", (data = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.racing) return;
    room.mapId = data.mapId || room.mapId;
    io.to(room.code).emit("room", room.snapshot());
    broadcastRooms();
  });

  socket.on("startRace", (data = {}) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || room.hostId !== socket.id || room.racing) return;
    if (data.mapId) room.mapId = data.mapId;
    room.racing = true;
    const players = room.playerList();
    io.to(room.code).emit("start", {
      mapId: room.mapId,
      players,
    });
    io.to(room.code).emit("room", room.snapshot());
    broadcastRooms();
  });

  // Game relay
  socket.on("game", (payload) => {
    const room = rooms.get(socket.data.roomCode);
    if (!room || !room.racing) return;
    socket.to(room.code).emit("game", { ...payload, from: socket.id });
  });

  socket.on("raceOver", () => {
    const room = rooms.get(socket.data.roomCode);
    if (!room) return;
    // allow re-lobby
    room.racing = false;
    io.to(room.code).emit("room", room.snapshot());
    broadcastRooms();
  });

  socket.on("listRooms", () => {
    socket.emit("rooms", publicRoomList());
  });

  socket.on("disconnect", () => leave(socket));
});

function leave(socket) {
  const c = socket.data.roomCode;
  if (!c) return;
  const room = rooms.get(c);
  if (!room) return;
  room.removePlayer(socket.id);
  socket.leave(c);
  socket.data.roomCode = null;
  if (room.players.size === 0) {
    rooms.delete(c);
  } else {
    io.to(room.code).emit("room", room.snapshot());
    io.to(room.code).emit("playerLeft", { id: socket.id });
  }
  broadcastRooms();
}

// cleanup stale empty rooms (safety)
setInterval(() => {
  const now = Date.now();
  for (const [c, r] of rooms) {
    if (r.players.size === 0 || now - r.createdAt > 6 * 60 * 60 * 1000) {
      rooms.delete(c);
    }
  }
}, 60000);

server.listen(PORT, () => {
  console.log(`Toon Car Racer server on :${PORT}`);
});
