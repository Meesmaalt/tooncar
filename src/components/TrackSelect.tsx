import React from 'react';
import { TRACK_DEFINITIONS } from '../game/tracks';
import { GameMode, SpeedClass } from '../types';
import { Flag, Compass, Flame, Trophy, Timer, Play, Gauge } from 'lucide-react';

interface TrackSelectProps {
  selectedTrackId: string;
  selectedLaps: number;
  gameMode: GameMode;
  speedClass: SpeedClass;
  onSelectTrack: (trackId: string) => void;
  onSelectLaps: (laps: number) => void;
  onSelectGameMode: (mode: GameMode) => void;
  onSelectSpeedClass: (sc: SpeedClass) => void;
}

export const TrackSelect: React.FC<TrackSelectProps> = ({
  selectedTrackId,
  selectedLaps,
  gameMode,
  speedClass,
  onSelectTrack,
  onSelectLaps,
  onSelectGameMode,
  onSelectSpeedClass,
}) => {
  return (
    <div id="track-select-screen" className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border-2 border-sky-400/40 shadow-2xl max-w-5xl w-full mx-auto text-white">
      {/* Header with Title and Mode selectors */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-2xl font-black tracking-wide text-sky-400 font-['Titan_One',sans-serif]">
            VALI RADA & MÄNGUREŽIIM
          </h2>
          <p className="text-sm text-slate-400">
            Vali üksiksõit, 4-etapiline Grand Prix karikasari või puhas ajasõit!
          </p>
        </div>

        {/* Options Row: Mode & Speed */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Game Mode */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onSelectGameMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'single'
                  ? 'bg-sky-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Üksiksõit
            </button>
            <button
              onClick={() => {
                onSelectGameMode('cup');
                onSelectTrack(TRACK_DEFINITIONS[0].id);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'cup'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" /> Karikasari
            </button>
            <button
              onClick={() => onSelectGameMode('timetrial')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                gameMode === 'timetrial'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Timer className="w-3.5 h-3.5" /> Ajasõit
            </button>
          </div>

          {/* Speed Class */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            {(['50cc', '100cc', '150cc'] as SpeedClass[]).map(sc => (
              <button
                key={sc}
                onClick={() => onSelectSpeedClass(sc)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  speedClass === sc
                    ? 'bg-red-500 text-white shadow-md scale-105'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sc}
              </button>
            ))}
          </div>

          {/* Laps */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 px-1">RINGE:</span>
            {[2, 3, 5].map(laps => (
              <button
                key={laps}
                onClick={() => onSelectLaps(laps)}
                className={`px-2 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${
                  selectedLaps === laps
                    ? 'bg-amber-400 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {laps}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Banner if Cup or Time Trial */}
      {gameMode === 'cup' && (
        <div className="mb-4 p-3 bg-amber-500/15 border border-amber-400/40 rounded-xl flex items-center gap-3 text-amber-200 text-xs">
          <Trophy className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <span className="font-bold text-amber-300">Toon Grand Prix Karikasari:</span> Sõidad järjest kõik 4 rada (Sunny Beach → Spooky Castle → Cyber Canyon → Frozen Peak). Iga etapi finišis jagatakse punkte (15, 12, 10, 8, 6, 4 pt)!
          </div>
        </div>
      )}

      {gameMode === 'timetrial' && (
        <div className="mb-4 p-3 bg-purple-500/15 border border-purple-400/40 rounded-xl flex items-center gap-3 text-purple-200 text-xs">
          <Timer className="w-5 h-5 text-purple-400 shrink-0" />
          <div>
            <span className="font-bold text-purple-300">Puhas Ajasõit:</span> Puuduvad vastased ja relvad. Keskendu ideaalsetele trajektooridele, drifti mini-turbodele ja püstitada absoluutne rajarekord!
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {TRACK_DEFINITIONS.map((track, idx) => {
          const isSelected = track.id === selectedTrackId;
          const themeGradient =
            track.theme === 'beach'
              ? 'from-sky-600 to-amber-500'
              : track.theme === 'spooky'
              ? 'from-purple-900 to-emerald-900'
              : track.theme === 'cyber'
              ? 'from-cyan-900 to-pink-900'
              : 'from-blue-600 to-cyan-400';

          const themeIcon =
            track.theme === 'beach'
              ? '🏝️'
              : track.theme === 'spooky'
              ? '🏰'
              : track.theme === 'cyber'
              ? '⚡'
              : '❄️';

          return (
            <div
              key={track.id}
              id={`track-card-${track.id}`}
              onClick={() => onSelectTrack(track.id)}
              className={`rounded-xl border-2 transition-all p-4 cursor-pointer flex flex-col justify-between relative overflow-hidden ${
                isSelected
                  ? 'border-sky-400 bg-sky-950/40 shadow-xl scale-[1.02] ring-2 ring-sky-400/20'
                  : 'border-slate-800 bg-slate-950/50 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              {/* Header Badge */}
              <div>
                <div className={`h-24 w-full rounded-lg bg-gradient-to-tr ${themeGradient} flex items-center justify-center mb-3 relative overflow-hidden shadow-inner`}>
                  <span className="text-4xl filter drop-shadow-md">
                    {themeIcon}
                  </span>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-950/80 text-white">
                    {track.difficulty}
                  </div>
                  {gameMode === 'cup' && (
                    <div className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-slate-950 shadow-md">
                      Etapp {idx + 1}
                    </div>
                  )}
                </div>

                <h3 className="font-black text-base text-white mb-1">{track.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{track.description}</p>
              </div>

              {/* Stats */}
              <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-300">
                <span className="flex items-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-sky-400" /> {track.lengthMeters}m
                </span>
                <span className="flex items-center gap-1">
                  <Flag className="w-3.5 h-3.5 text-amber-400" /> {selectedLaps} ringi
                </span>
                <span className="flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-red-400" /> {gameMode === 'timetrial' ? 'Solo' : 'Kastid'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
