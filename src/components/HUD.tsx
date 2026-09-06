import React, { useEffect, useRef } from 'react';
import { PowerUpType } from '../types';
import { POWER_UPS } from '../game/powerups';
import { soundManager } from '../audio/soundManager';
import { Volume2, VolumeX, Shield, Zap, Sparkles } from 'lucide-react';

interface HUDProps {
  speed: number;
  lap: number;
  totalLaps: number;
  position: number;
  totalRacers: number;
  currentItem: PowerUpType | null;
  isDrifting: boolean;
  hasTurbo: boolean;
  hasShield: boolean;
  isWrongWay?: boolean;
  currentLapTime?: number;
  bestLapTime?: number | null;
  driftCharge?: number;
  combatEvents: string[];
  countdownText: string | number;
  minimapData: {
    curvePoints: { x: number; z: number }[];
    racers: { id: string; x: number; z: number; color: string; isPlayer: boolean; position: number }[];
  } | null;
  onUseItem: () => void;
  onHonk: () => void;
  onLookBehindToggle?: (active: boolean) => void;
  onRespawn?: () => void;
  // Touch handlers
  onInputStart: (action: 'throttle' | 'brake' | 'left' | 'right' | 'drift') => void;
  onInputEnd: (action: 'throttle' | 'brake' | 'left' | 'right' | 'drift') => void;
}

const formatLapTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00.00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${m}:${s.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const HUD: React.FC<HUDProps> = ({
  speed,
  lap,
  totalLaps,
  position,
  totalRacers,
  currentItem,
  isDrifting,
  hasTurbo,
  hasShield,
  isWrongWay = false,
  currentLapTime = 0,
  bestLapTime = null,
  driftCharge = 0,
  combatEvents,
  countdownText,
  minimapData,
  onUseItem,
  onHonk,
  onLookBehindToggle,
  onRespawn,
  onInputStart,
  onInputEnd,
}) => {
  const minimapCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isMuted, setIsMuted] = React.useState(false);

  const toggleMute = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  // Draw 2D Top-Down Minimap Radar
  useEffect(() => {
    const canvas = minimapCanvasRef.current;
    if (!canvas || !minimapData || minimapData.curvePoints.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Find bounds of track points
    let minX = Infinity, maxX = -Infinity;
    let minZ = Infinity, maxZ = -Infinity;
    minimapData.curvePoints.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.z < minZ) minZ = p.z;
      if (p.z > maxZ) maxZ = p.z;
    });

    const padding = 16;
    const trackW = Math.max(10, maxX - minX);
    const trackH = Math.max(10, maxZ - minZ);
    const scale = Math.min((width - padding * 2) / trackW, (height - padding * 2) / trackH);

    const toCanvasX = (worldX: number) => width / 2 + (worldX - (minX + maxX) / 2) * scale;
    const toCanvasY = (worldZ: number) => height / 2 + (worldZ - (minZ + maxZ) / 2) * scale;

    // Draw track path ribbon
    ctx.beginPath();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    minimapData.curvePoints.forEach((p, idx) => {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.z);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();

    // Inner asphalt line
    ctx.beginPath();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 5;
    minimapData.curvePoints.forEach((p, idx) => {
      const cx = toCanvasX(p.x);
      const cy = toCanvasY(p.z);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.closePath();
    ctx.stroke();

    // Start line marker
    const s0 = minimapData.curvePoints[0];
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(toCanvasX(s0.x), toCanvasY(s0.z), 4, 0, Math.PI * 2);
    ctx.fill();

    // Draw racers dots
    minimapData.racers.forEach(r => {
      const rx = toCanvasX(r.x);
      const ry = toCanvasY(r.z);

      if (r.isPlayer) {
        // Glowing animated player ring
        ctx.beginPath();
        ctx.arc(rx, ry, 7, 0, Math.PI * 2);
        ctx.fillStyle = '#facc15';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(rx, ry, 5, 0, Math.PI * 2);
        ctx.fillStyle = r.color || '#ef4444';
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#000000';
        ctx.stroke();
      }
    });
  }, [minimapData]);

  // Position ordinal suffix & color
  const getPositionBadge = (pos: number) => {
    switch (pos) {
      case 1:
        return { text: '1ST', color: 'from-amber-400 to-yellow-600', border: 'border-yellow-300' };
      case 2:
        return { text: '2ND', color: 'from-slate-200 to-slate-400', border: 'border-slate-100' };
      case 3:
        return { text: '3RD', color: 'from-amber-600 to-amber-800', border: 'border-amber-500' };
      default:
        return { text: `${pos}TH`, color: 'from-blue-600 to-indigo-800', border: 'border-blue-400' };
    }
  };

  const posBadge = getPositionBadge(position);
  const isFinalLap = lap === totalLaps;

  return (
    <div id="game-hud" className="absolute inset-0 pointer-events-none select-none flex flex-col justify-between p-4 md:p-6 overflow-hidden">
      {/* Top Bar: Standings, Lap, Minimap, Audio */}
      <div className="flex items-start justify-between w-full">
        {/* Left: Position & Lap Counter */}
        <div className="flex items-center gap-3">
          {/* Position Badge */}
          <div
            className={`bg-gradient-to-b ${posBadge.color} ${posBadge.border} border-3 shadow-xl rounded-2xl px-4 py-2 text-center text-white transform -rotate-3 transition-transform`}
          >
            <div className="text-3xl md:text-5xl font-black font-['Titan_One',sans-serif] drop-shadow-md">
              {posBadge.text}
            </div>
            <div className="text-[10px] md:text-xs font-bold text-slate-900/80 -mt-1 uppercase tracking-wider">
              / {totalRacers} SÕITJAT
            </div>
          </div>

          {/* Lap Counter */}
          <div className="bg-slate-900/80 backdrop-blur-md border-2 border-slate-700/80 rounded-xl px-4 py-2 text-white shadow-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">RING</div>
            <div className="text-xl md:text-2xl font-black font-['Titan_One',sans-serif] text-sky-400">
              {lap} <span className="text-slate-500 text-base">/ {totalLaps}</span>
            </div>
            {isFinalLap && (
              <div className="text-[10px] font-black text-amber-400 animate-pulse uppercase">
                ⚡ VIIMANE RING!
              </div>
            )}
          </div>

          {/* Lap Timing Card */}
          <div className="bg-slate-900/80 backdrop-blur-md border-2 border-slate-700/80 rounded-xl px-3 py-2 text-white shadow-lg hidden sm:block">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">AEG</div>
            <div className="text-sm md:text-base font-black font-mono text-amber-300">
              {formatLapTime(currentLapTime)}
            </div>
            {bestLapTime && (
              <div className="text-[9px] font-bold text-emerald-400 font-mono">
                ★ PARIM: {formatLapTime(bestLapTime)}
              </div>
            )}
          </div>
        </div>

        {/* Center: Wrong-Way Warning Banner */}
        {isWrongWay && (
          <div className="absolute top-28 left-1/2 -translate-x-1/2 z-40 bg-gradient-to-r from-red-600 via-rose-600 to-red-600 border-4 border-yellow-300 px-6 py-3 rounded-2xl shadow-2xl animate-pulse text-center">
            <div className="text-2xl md:text-3xl font-black font-['Titan_One',sans-serif] text-white drop-shadow-md">
              ⚠️ VALE SUUND!
            </div>
            <div className="text-xs font-black text-yellow-200 mt-0.5">
              PÖÖRA AUTO RINGI VÕI VAJUTA [R] TAASTAMISEKS!
            </div>
          </div>
        )}

        {/* Center: Big Countdown / Final Lap flash banner */}
        {countdownText && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
            <div className="text-6xl md:text-8xl font-black text-amber-400 drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] font-['Titan_One',sans-serif] animate-bounce">
              {countdownText}
            </div>
          </div>
        )}

        {/* Right: Minimap Radar & Sound Mute */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="pointer-events-auto p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 shadow-md cursor-pointer transition-transform hover:scale-105"
              title="Heli sisse/välja"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
            </button>
          </div>

          {/* Minimap radar canvas */}
          <div className="bg-slate-950/80 backdrop-blur-md rounded-2xl p-1.5 border-2 border-slate-800 shadow-xl">
            <canvas
              ref={minimapCanvasRef}
              width={140}
              height={140}
              className="rounded-xl w-28 h-28 md:w-36 md:h-36 block"
            />
          </div>
        </div>
      </div>

      {/* Center Left: Live Combat Events Feed */}
      <div className="max-w-sm space-y-1.5 self-start">
        {combatEvents.slice(-3).map((evt, idx) => (
          <div
            key={idx}
            className="bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-2 animate-fade-in"
          >
            <span>{evt}</span>
          </div>
        ))}
      </div>

      {/* Bottom Bar: Power-Up Slot, Speedometer, Mobile Controls */}
      <div className="flex items-end justify-between w-full">
        {/* Power-up Item Slot */}
        <div className="flex items-center gap-3">
          <div
            onClick={onUseItem}
            className={`pointer-events-auto relative w-20 h-20 md:w-24 md:h-24 rounded-2xl border-4 transition-all flex flex-col items-center justify-center cursor-pointer shadow-2xl ${
              currentItem
                ? 'bg-gradient-to-br from-amber-400/90 to-yellow-600/90 border-yellow-200 scale-105 animate-pulse'
                : 'bg-slate-900/80 border-slate-700/80'
            }`}
          >
            {currentItem ? (
              <>
                <span className="text-3xl md:text-4xl drop-shadow-md">
                  {POWER_UPS[currentItem]?.icon || '🎁'}
                </span>
                <span className="text-[10px] md:text-xs font-black text-slate-950 mt-1 uppercase">
                  {POWER_UPS[currentItem]?.name}
                </span>
                <span className="absolute -bottom-2 bg-slate-950 px-2 py-0.5 rounded text-[9px] font-bold text-amber-300 border border-amber-400">
                  [E / Tühik]
                </span>
              </>
            ) : (
              <span className="text-2xl opacity-30">❓</span>
            )}
          </div>

          {/* Active Buff Badges */}
          <div className="flex flex-col gap-1.5">
            {hasTurbo && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs shadow-lg animate-bounce">
                <Zap className="w-3.5 h-3.5 fill-current" /> NITRO!
              </div>
            )}
            {hasShield && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500 text-white font-black text-xs shadow-lg animate-pulse">
                <Shield className="w-3.5 h-3.5 fill-current" /> KILP
              </div>
            )}
            {isDrifting && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-600 text-white font-black text-xs shadow-lg">
                <Sparkles className="w-3.5 h-3.5" />
                {driftCharge === 2 ? (
                  <span className="text-cyan-200 animate-pulse">🔥 SUPER TURBO!</span>
                ) : driftCharge === 1 ? (
                  <span className="text-yellow-200">⚡ MINI-TURBO!</span>
                ) : (
                  <span>DRIFT...</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Speedometer, Horn, Respawn, Look Behind */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Quick Action Buttons (Respawn & Look Behind) */}
          <div className="flex flex-col gap-2">
            {onRespawn && (
              <button
                onClick={onRespawn}
                className="pointer-events-auto px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-md cursor-pointer text-[10px] font-bold transition-transform active:scale-95"
                title="Taasta auto rajale [R]"
              >
                🔄 [R] Taasta
              </button>
            )}
            {onLookBehindToggle && (
              <button
                onMouseDown={() => onLookBehindToggle(true)}
                onMouseUp={() => onLookBehindToggle(false)}
                onTouchStart={() => onLookBehindToggle(true)}
                onTouchEnd={() => onLookBehindToggle(false)}
                className="pointer-events-auto px-2.5 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-700 shadow-md cursor-pointer text-[10px] font-bold transition-transform active:scale-95"
                title="Vaata seljataha [C]"
              >
                👁️ [C] Taha
              </button>
            )}
          </div>

          <button
            onClick={onHonk}
            className="pointer-events-auto p-3 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs border-2 border-yellow-200 shadow-xl cursor-pointer transition-transform active:scale-95 flex flex-col items-center"
            title="Signaal / Honk [H]"
          >
            <span className="text-xl">📢</span>
            <span className="text-[10px] font-bold">[H] Tuut!</span>
          </button>

          {/* Speedometer Dial */}
          <div className="bg-slate-950/85 backdrop-blur-md border-3 border-slate-700/80 rounded-2xl p-3 md:p-4 text-center text-white shadow-2xl min-w-[110px]">
            <div className="text-3xl md:text-5xl font-black font-['Titan_One',sans-serif] text-amber-400">
              {speed}
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">KM / H</div>
            {/* Speed bar */}
            <div className="w-full h-1.5 bg-slate-800 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-red-500 transition-all duration-100"
                style={{ width: `${Math.min(100, (speed / 70) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* On-screen Touch Controls for Mobile/Tablets (visible on touch devices or small screens) */}
      <div className="pointer-events-auto md:hidden flex justify-between items-end mt-2 pb-2">
        {/* Left & Right Steering + Action buttons */}
        <div className="flex gap-2 items-center">
          <button
            onTouchStart={() => onInputStart('left')}
            onTouchEnd={() => onInputEnd('left')}
            onMouseDown={() => onInputStart('left')}
            onMouseUp={() => onInputEnd('left')}
            className="w-14 h-14 bg-slate-900/80 active:bg-amber-500 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          >
            ◀
          </button>
          <button
            onTouchStart={() => onInputStart('right')}
            onTouchEnd={() => onInputEnd('right')}
            onMouseDown={() => onInputStart('right')}
            onMouseUp={() => onInputEnd('right')}
            className="w-14 h-14 bg-slate-900/80 active:bg-amber-500 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
          >
            ▶
          </button>
          {onRespawn && (
            <button
              onClick={onRespawn}
              className="w-10 h-10 bg-slate-900/90 active:bg-amber-600 border border-slate-700 rounded-xl flex items-center justify-center text-xs shadow-md"
              title="Taasta"
            >
              🔄
            </button>
          )}
        </div>

        {/* Gas, Brake, Drift, Rear View */}
        <div className="flex gap-2 items-center">
          {onLookBehindToggle && (
            <button
              onTouchStart={() => onLookBehindToggle(true)}
              onTouchEnd={() => onLookBehindToggle(false)}
              onMouseDown={() => onLookBehindToggle(true)}
              onMouseUp={() => onLookBehindToggle(false)}
              className="w-10 h-10 bg-slate-900/90 active:bg-sky-600 border border-slate-700 rounded-xl flex items-center justify-center text-xs shadow-md"
              title="Taha"
            >
              👁️
            </button>
          )}
          <button
            onTouchStart={() => onInputStart('drift')}
            onTouchEnd={() => onInputEnd('drift')}
            onMouseDown={() => onInputStart('drift')}
            onMouseUp={() => onInputEnd('drift')}
            className="w-12 h-12 bg-red-600/80 active:bg-red-500 border-2 border-red-400 rounded-xl flex items-center justify-center text-white text-xs font-black shadow-lg"
          >
            DRIFT
          </button>
          <button
            onTouchStart={() => onInputStart('brake')}
            onTouchEnd={() => onInputEnd('brake')}
            onMouseDown={() => onInputStart('brake')}
            onMouseUp={() => onInputEnd('brake')}
            className="w-14 h-14 bg-slate-800/90 active:bg-rose-600 border-2 border-slate-700 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg"
          >
            PIDUR
          </button>
          <button
            onTouchStart={() => onInputStart('throttle')}
            onTouchEnd={() => onInputEnd('throttle')}
            onMouseDown={() => onInputStart('throttle')}
            onMouseUp={() => onInputEnd('throttle')}
            className="w-14 h-14 bg-emerald-600/90 active:bg-emerald-500 border-2 border-emerald-400 rounded-2xl flex items-center justify-center text-white text-xs font-black shadow-lg"
          >
            GAAS
          </button>
        </div>
      </div>
    </div>
  );
};
