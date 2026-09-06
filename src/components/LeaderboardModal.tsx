import React from 'react';
import { RacerState, GameMode, CupStanding } from '../types';
import { CAR_DEFINITIONS } from '../game/cars';
import { Trophy, RotateCcw, Home, Flag, ArrowRight, Medal } from 'lucide-react';

interface LeaderboardModalProps {
  results: RacerState[];
  gameMode?: GameMode;
  cupStandings?: CupStanding[];
  cupStage?: number;
  totalCupStages?: number;
  onNextCupStage?: () => void;
  onRestart: () => void;
  onTrackSelect: () => void;
  onHome: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  results,
  gameMode,
  cupStandings,
  cupStage = 1,
  totalCupStages = 4,
  onNextCupStage,
  onRestart,
  onTrackSelect,
  onHome,
}) => {
  // Sort results by position
  const sorted = [...results].sort((a, b) => a.position - b.position);
  const first = sorted[0];
  const second = sorted[1];
  const third = sorted[2];

  const isCup = gameMode === 'cup';
  const isCupFinal = isCup && cupStage >= totalCupStages;

  // Cup standings sorted by points
  const sortedCup = cupStandings ? [...cupStandings].sort((a, b) => b.points - a.points) : [];

  const getCarInfo = (carId: string) => {
    return CAR_DEFINITIONS.find(c => c.id === carId) || CAR_DEFINITIONS[0];
  };

  return (
    <div id="leaderboard-modal" className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 md:p-8 max-w-xl w-full shadow-2xl text-white text-center animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Title */}
        <div className="flex items-center justify-center gap-2 mb-2">
          <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
          <h2 className="text-3xl md:text-4xl font-black font-['Titan_One',sans-serif] text-amber-400">
            {isCupFinal ? '🏆 KARIKASARI LÕPPENUD!' : isCup ? `🏁 ETAPP ${cupStage}/${totalCupStages} FINIŠ!` : 'FINIŠ!'}
          </h2>
          <Trophy className="w-8 h-8 text-amber-400 animate-bounce" />
        </div>
        <p className="text-sm text-slate-400 mb-6">
          {isCupFinal
            ? 'Grand Prix 4 etappi on sõidetud! Vaata karikasarja üldvõitjat ja punkte.'
            : isCup
            ? `Etapp ${cupStage} on lõppenud! Vaata etapi tulemusi ja karikatabelit.`
            : 'Võidusõit on lõppenud! Vaata poodiumikohti ja lõplikke tulemusi.'}
        </p>

        {/* 3D Cartoon Podium */}
        <div className="grid grid-cols-3 gap-2 items-end mb-6 px-2">
          {/* 2nd Place */}
          {second && (
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{getCarInfo(second.carId).driverAvatar}</span>
              <div className="text-xs font-bold text-slate-300 truncate max-w-[90px]">{second.name}</div>
              <div className="w-full h-20 bg-gradient-to-t from-slate-700 to-slate-500 rounded-t-xl flex flex-col items-center justify-center border-t-2 border-slate-300 shadow-md">
                <span className="text-2xl font-black font-['Titan_One',sans-serif] text-white">2</span>
                <span className="text-[10px] font-bold text-slate-300">HÕBE</span>
              </div>
            </div>
          )}

          {/* 1st Place (Winner) */}
          {first && (
            <div className="flex flex-col items-center">
              <div className="text-4xl mb-1 filter drop-shadow animate-bounce">
                👑 {getCarInfo(first.carId).driverAvatar}
              </div>
              <div className="text-sm font-black text-amber-300 truncate max-w-[110px]">{first.name}</div>
              <div className="w-full h-28 bg-gradient-to-t from-amber-600 to-yellow-400 rounded-t-xl flex flex-col items-center justify-center border-t-3 border-yellow-200 shadow-xl">
                <span className="text-4xl font-black font-['Titan_One',sans-serif] text-slate-950">1</span>
                <span className="text-xs font-black text-slate-900">KULD</span>
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {third && (
            <div className="flex flex-col items-center">
              <span className="text-3xl mb-1">{getCarInfo(third.carId).driverAvatar}</span>
              <div className="text-xs font-bold text-amber-200 truncate max-w-[90px]">{third.name}</div>
              <div className="w-full h-16 bg-gradient-to-t from-amber-900 to-amber-700 rounded-t-xl flex flex-col items-center justify-center border-t-2 border-amber-500 shadow-md">
                <span className="text-2xl font-black font-['Titan_One',sans-serif] text-amber-200">3</span>
                <span className="text-[10px] font-bold text-amber-300">PRONKS</span>
              </div>
            </div>
          )}
        </div>

        {/* If Cup Mode: Display Cup Standings Table */}
        {isCup && sortedCup.length > 0 && (
          <div className="mb-6 bg-slate-950/80 rounded-xl border border-amber-500/30 p-3 text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 flex items-center gap-1.5">
              <Medal className="w-3.5 h-3.5" /> Karikasarja Üldseis (Pärast {cupStage}. etappi)
            </h4>
            <div className="divide-y divide-slate-800 text-xs">
              {sortedCup.map((cs, idx) => {
                const car = getCarInfo(cs.carId);
                return (
                  <div key={cs.racerId} className="py-1.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-amber-400 w-5">#{idx + 1}</span>
                      <span>{car.driverAvatar}</span>
                      <span className="font-bold text-slate-200">{cs.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">{cs.stageWins} võitu</span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-black">
                        {cs.points} pt
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Full Results Table (for single or detailed stage) */}
        {!isCup && (
          <div className="bg-slate-950/80 rounded-xl border border-slate-800 p-2 mb-6 max-h-36 overflow-y-auto divide-y divide-slate-800">
            {sorted.map((r, idx) => {
              const car = getCarInfo(r.carId);
              return (
                <div key={r.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-400 w-5 text-left">#{idx + 1}</span>
                    <span className="text-base">{car.driverAvatar}</span>
                    <span className={`font-bold ${r.isAI ? 'text-slate-300' : 'text-amber-300'}`}>
                      {r.name}
                    </span>
                  </div>
                  <div className="text-slate-400 text-[11px] flex items-center gap-2">
                    <span>{car.name}</span>
                    <span className="font-mono text-emerald-400">FINIŠ</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 justify-center">
          {/* Next Cup Stage Button */}
          {isCup && !isCupFinal && onNextCupStage && (
            <button
              onClick={onNextCupStage}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm transition-transform hover:scale-105 cursor-pointer shadow-xl"
            >
              <span>JÄRGMINE ETAPP ({cupStage + 1}/{totalCupStages})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {!isCup && (
            <button
              onClick={onRestart}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm transition-transform hover:scale-105 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" /> Sõida uuesti
            </button>
          )}

          <button
            onClick={onTrackSelect}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-black text-sm transition-transform hover:scale-105 cursor-pointer shadow-lg"
          >
            <Flag className="w-4 h-4" /> Vali rada / režiim
          </button>
          <button
            onClick={onHome}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm transition-transform hover:scale-105 cursor-pointer"
          >
            <Home className="w-4 h-4" /> Peamenüü
          </button>
        </div>
      </div>
    </div>
  );
};
