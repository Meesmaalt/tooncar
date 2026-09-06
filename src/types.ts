export type PowerUpType = 
  | 'rocket'       // Direct / Homing missile
  | 'trio_rockets'  // 3 forward rockets
  | 'mine'         // TNT explosive / Banana trap behind
  | 'shield'       // Bubble forcefield
  | 'turbo'        // Super nitro speed boost
  | 'lightning'    // Zaps and slows opponents
  | 'anvil'        // 10-ton weight on race leader
  | 'repair';      // Fixes spinout / restores health

export interface CarStats {
  speed: number;        // Top speed factor (1-10)
  accel: number;        // Acceleration factor (1-10)
  handling: number;     // Turning and drift control (1-10)
  armor: number;        // Weight & ramming resilience (1-10)
}

export interface CarDefinition {
  id: string;
  name: string;
  driverName: string;
  driverAvatar: string; // Emoji / Icon
  description: string;
  primaryColor: string;
  secondaryColor: string;
  stats: CarStats;
  type: 'speed' | 'heavy' | 'tech' | 'agile' | 'wild' | 'cop';
}

export interface TrackCheckpoint {
  x: number;
  y: number;
  z: number;
  radius: number;
}

export interface TrackDefinition {
  id: string;
  name: string;
  theme: 'beach' | 'spooky' | 'cyber' | 'ice';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  description: string;
  lengthMeters: number;
  lapsDefault: number;
  skyColor: number;
  fogColor: number;
  groundColor: number;
  trackColor: number;
  curbColorA: number;
  curbColorB: number;
  points: [number, number, number][]; // 3D spline control points
}

export type GameMode = 'single' | 'cup' | 'timetrial';
export type SpeedClass = '50cc' | '100cc' | '150cc';

export type UnderglowColor = 'none' | '#06b6d4' | '#22c55e' | '#ec4899' | '#eab308' | '#a855f7';
export type RimStyle = 'sport' | 'monster' | 'gold' | 'cyber';
export type FinishType = 'gloss' | 'metallic' | 'matte';

export interface CarCustomization {
  underglow: UnderglowColor;
  rimStyle: RimStyle;
  finish: FinishType;
}

export interface CupStanding {
  racerId: string;
  name: string;
  carId: string;
  points: number;
  stageWins: number;
}

export interface Projectile {
  id: string;
  type: 'rocket' | 'mine' | 'anvil';
  ownerId: string;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  targetId?: string;
  life: number;
  active: boolean;
}

export interface PlayerInput {
  throttle: number; // 0 to 1
  brake: number;    // 0 to 1
  steer: number;    // -1 (left) to 1 (right)
  drift: boolean;
  useItem: boolean;
  honk: boolean;
  lookBehind?: boolean;
  respawn?: boolean;
}

export interface RacerState {
  id: string;
  name: string;
  carId: string;
  isAI: boolean;
  color: string;
  x: number;
  y: number;
  z: number;
  rotY: number;
  rotX: number;
  rotZ: number;
  speed: number;
  steerAngle: number;
  driftFactor: number;
  isDrifting: boolean;
  driftChargeTime: number;
  
  // Race status
  lap: number;
  checkpointIndex: number;
  totalDistance: number;
  position: number;
  finished: boolean;
  finishTime?: number;
  lapTimes: number[];
  currentLapStartTime: number;
  bestLapTime: number | null;
  isWrongWay?: boolean;
  
  // Powerups & statuses
  currentItem: PowerUpType | null;
  hasShield: boolean;
  shieldTimer: number;
  turboTimer: number;
  spinTimer: number;
  frozenTimer: number;
  
  // Visual/Animation
  wheelRot: number;
  bounceOffset: number;
  speechText?: string;
  speechTimer?: number;
}

export interface RoomPlayer {
  id: string;
  name: string;
  carId: string;
  color: string;
  isReady: boolean;
  isHost: boolean;
}

export interface RoomInfo {
  id: string;
  name: string;
  trackId: string;
  laps: number;
  maxPlayers: number;
  players: RoomPlayer[];
  state: 'waiting' | 'starting' | 'racing' | 'finished';
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  sfxVolume: number;
  musicVolume: number;
  controls: 'keyboard' | 'touch';
  graphicsQuality: 'high' | 'medium';
}
