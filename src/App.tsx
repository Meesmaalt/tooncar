import React, { useState, useEffect, useRef } from 'react';
import { ToonCarEngine } from './game/engine';
import { CAR_DEFINITIONS } from './game/cars';
import { TRACK_DEFINITIONS } from './game/tracks';
import { PowerUpType, RacerState, RoomInfo, GameMode, SpeedClass, CarCustomization, CupStanding } from './types';
import { HUD } from './components/HUD';
import { CarSelect } from './components/CarSelect';
import { TrackSelect } from './components/TrackSelect';
import { Lobby } from './components/Lobby';
import { LeaderboardModal } from './components/LeaderboardModal';
import { ControlsHelpModal } from './components/ControlsHelpModal';
import { soundManager } from './audio/soundManager';
import { Play, Users, Car, HelpCircle, Trophy, Sparkles, Volume2, Timer } from 'lucide-react';

type ScreenState = 'menu' | 'car_select' | 'track_select' | 'lobby' | 'racing' | 'results';

export default function App() {
  const [screen, setScreen] = useState<ScreenState>('menu');

  // Selected Player Config
  const [playerName, setPlayerName] = useState('Tommy Rocket');
  const [selectedCarId, setSelectedCarId] = useState('speedy_turbo');
  const [selectedColor, setSelectedColor] = useState('#ef4444');
  const [selectedTrackId, setSelectedTrackId] = useState('sunny_beach');
  const [selectedLaps, setSelectedLaps] = useState(3);

  // New Modes & Customization
  const [customization, setCustomization] = useState<CarCustomization>({
    finish: 'gloss',
    rimStyle: 'sport',
    underglow: 'none',
  });
  const [gameMode, setGameMode] = useState<GameMode>('single');
  const [speedClass, setSpeedClass] = useState<SpeedClass>('100cc');
  const [cupStandings, setCupStandings] = useState<CupStanding[]>([]);
  const [cupStageIndex, setCupStageIndex] = useState<number>(0);

  // Modals
  const [showControls, setShowControls] = useState(false);

  // Game Engine & Canvas Ref
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ToonCarEngine | null>(null);

  // Live In-Game HUD state
  const [hudData, setHudData] = useState({
    speed: 0,
    lap: 1,
    totalLaps: 3,
    position: 1,
    totalRacers: 6,
    currentItem: null as PowerUpType | null,
    isDrifting: false,
    hasTurbo: false,
    hasShield: false,
    isWrongWay: false,
    currentLapTime: 0,
    bestLapTime: null as number | null,
    driftCharge: 0,
  });
  const [combatEvents, setCombatEvents] = useState<string[]>([]);
  const [countdownText, setCountdownText] = useState<string | number>('');
  const [minimapData, setMinimapData] = useState<any>(null);
  const [raceResults, setRaceResults] = useState<RacerState[]>([]);

  // Multiplayer WebSocket State
  const wsRef = useRef<WebSocket | null>(null);
  const [currentRoom, setCurrentRoom] = useState<RoomInfo | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: string; text: string }[]>([]);
  const [isMultiplayer, setIsMultiplayer] = useState(false);
  const [multiplayerRacers, setMultiplayerRacers] = useState<any[]>([]);

  // Initialize WebSocket connection
  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to Toon Car game server');
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'room_joined') {
          setCurrentRoom(msg.room);
        } else if (msg.type === 'player_joined') {
          setCurrentRoom(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              players: [...prev.players.filter(p => p.id !== msg.player.id), msg.player],
            };
          });
        } else if (msg.type === 'player_left') {
          setCurrentRoom(prev => {
            if (!prev) return prev;
            const updated = prev.players.filter(p => p.id !== msg.playerId);
            if (msg.newHostId) {
              const hostP = updated.find(p => p.id === msg.newHostId);
              if (hostP) hostP.isHost = true;
            }
            return { ...prev, players: updated };
          });
        } else if (msg.type === 'player_ready_changed') {
          setCurrentRoom(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map(p =>
                p.id === msg.playerId ? { ...p, isReady: msg.isReady } : p
              ),
            };
          });
        } else if (msg.type === 'player_car_changed') {
          setCurrentRoom(prev => {
            if (!prev) return prev;
            return {
              ...prev,
              players: prev.players.map(p =>
                p.id === msg.playerId ? { ...p, carId: msg.carId, color: msg.color } : p
              ),
            };
          });
        } else if (msg.type === 'chat_message') {
          setChatMessages(prev => [...prev.slice(-20), { sender: msg.sender, text: msg.text }]);
        } else if (msg.type === 'race_started') {
          setIsMultiplayer(true);
          setMultiplayerRacers(msg.players);
          setSelectedTrackId(msg.trackId);
          setSelectedLaps(msg.laps);
          setScreen('racing');
        }
      } catch (err) {
        console.error(err);
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  // Keyboard input listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') engine.localInput.throttle = 1;
      if (code === 'KeyS' || code === 'ArrowDown') engine.localInput.brake = 1;
      if (code === 'KeyA' || code === 'ArrowLeft') engine.localInput.steer = 1;
      if (code === 'KeyD' || code === 'ArrowRight') engine.localInput.steer = -1;
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Space') {
        engine.localInput.drift = true;
      }
      if (code === 'KeyE') engine.localInput.useItem = true;
      if (code === 'KeyH') engine.localInput.honk = true;
      if (code === 'KeyC') engine.localInput.lookBehind = true;
      if (code === 'KeyR') engine.localInput.respawn = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      if (!engine) return;

      const code = e.code;
      if (code === 'KeyW' || code === 'ArrowUp') engine.localInput.throttle = 0;
      if (code === 'KeyS' || code === 'ArrowDown') engine.localInput.brake = 0;
      if (code === 'KeyA' || code === 'ArrowLeft') {
        if (engine.localInput.steer > 0) engine.localInput.steer = 0;
      }
      if (code === 'KeyD' || code === 'ArrowRight') {
        if (engine.localInput.steer < 0) engine.localInput.steer = 0;
      }
      if (code === 'ShiftLeft' || code === 'ShiftRight' || code === 'Space') {
        engine.localInput.drift = false;
      }
      if (code === 'KeyC') engine.localInput.lookBehind = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Launch Game when entering 'racing' state
  useEffect(() => {
    if (screen !== 'racing') {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
      return;
    }

    const container = gameContainerRef.current;
    if (!container) return;

    soundManager.init();

    const trackDef = TRACK_DEFINITIONS.find(t => t.id === selectedTrackId) || TRACK_DEFINITIONS[0];

    const engine = new ToonCarEngine(
      container,
      trackDef,
      selectedCarId,
      selectedColor,
      selectedLaps,
      {
        onHUDUpdate: (data) => {
          setHudData(data);
          if (engineRef.current) {
            setMinimapData(engineRef.current.getMinimapData());
          }
        },
        onCombatEvent: (msg) => {
          setCombatEvents(prev => [...prev.slice(-4), msg]);
        },
        onRaceFinished: (results) => {
          setRaceResults(results);
          if (gameMode === 'cup') {
            const pointsTable = [15, 12, 10, 8, 6, 4];
            setCupStandings(prev => {
              const updated = [...prev];
              results.forEach((r, idx) => {
                const pts = pointsTable[idx] || 2;
                const existing = updated.find(u => u.racerId === r.id);
                if (existing) {
                  existing.points += pts;
                  if (idx === 0) existing.stageWins += 1;
                } else {
                  updated.push({
                    racerId: r.id,
                    name: r.name,
                    carId: r.carId,
                    points: pts,
                    stageWins: idx === 0 ? 1 : 0,
                  });
                }
              });
              return updated;
            });
          }
          setScreen('results');
        },
        onCountdownTick: (val) => {
          setCountdownText(val);
        },
      },
      isMultiplayer
        ? multiplayerRacers
        : gameMode === 'timetrial'
        ? [{ id: 'player_1', name: playerName, carId: selectedCarId, color: selectedColor, isAI: false }]
        : undefined,
      customization,
      speedClass
    );

    engineRef.current = engine;

    return () => {
      if (engineRef.current) {
        engineRef.current.destroy();
        engineRef.current = null;
      }
    };
  }, [screen, selectedTrackId, selectedCarId, selectedColor, selectedLaps, isMultiplayer, multiplayerRacers, customization, speedClass, gameMode, playerName]);

  const handleNextCupStage = () => {
    const nextIdx = cupStageIndex + 1;
    if (nextIdx < TRACK_DEFINITIONS.length) {
      setCupStageIndex(nextIdx);
      setSelectedTrackId(TRACK_DEFINITIONS[nextIdx].id);
      setScreen('racing');
    }
  };

  const handleStartGame = () => {
    if (gameMode === 'cup') {
      setCupStageIndex(0);
      setCupStandings([]);
      setSelectedTrackId(TRACK_DEFINITIONS[0].id);
    }
    setScreen('racing');
  };

  // Touch control button handlers
  const handleTouchInputStart = (action: 'throttle' | 'brake' | 'left' | 'right' | 'drift') => {
    const engine = engineRef.current;
    if (!engine) return;
    if (action === 'throttle') engine.localInput.throttle = 1;
    if (action === 'brake') engine.localInput.brake = 1;
    if (action === 'left') engine.localInput.steer = 1;
    if (action === 'right') engine.localInput.steer = -1;
    if (action === 'drift') engine.localInput.drift = true;
  };

  const handleTouchInputEnd = (action: 'throttle' | 'brake' | 'left' | 'right' | 'drift') => {
    const engine = engineRef.current;
    if (!engine) return;
    if (action === 'throttle') engine.localInput.throttle = 0;
    if (action === 'brake') engine.localInput.brake = 0;
    if (action === 'left' && engine.localInput.steer > 0) engine.localInput.steer = 0;
    if (action === 'right' && engine.localInput.steer < 0) engine.localInput.steer = 0;
    if (action === 'drift') engine.localInput.drift = false;
  };

  // Multiplayer Actions
  const handleJoinRoom = (roomId: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({
      type: 'join_room',
      roomId,
      player: {
        id: `player_${Date.now()}`,
        name: playerName,
        carId: selectedCarId,
        color: selectedColor,
      },
    }));
  };

  const handleCreateRoom = (name: string, trackId: string, laps: number, maxPlayers: number) => {
    fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, trackId, laps, maxPlayers }),
    })
      .then(res => res.json())
      .then(room => {
        handleJoinRoom(room.id);
      });
  };

  const handleToggleReady = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'toggle_ready' }));
    }
  };

  const handleStartRace = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'start_race' }));
    }
  };

  const handleLeaveRoom = () => {
    setCurrentRoom(null);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'leave_room' }));
    }
  };

  const handleSendMessage = (text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        sender: playerName,
        text,
      }));
    }
  };

  const selectedCar = CAR_DEFINITIONS.find(c => c.id === selectedCarId) || CAR_DEFINITIONS[0];
  const selectedTrack = TRACK_DEFINITIONS.find(t => t.id === selectedTrackId) || TRACK_DEFINITIONS[0];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-['Fredoka',sans-serif] select-none text-slate-100">
      {/* 3D Game Canvas Area */}
      <div
        ref={gameContainerRef}
        className={`w-full h-full ${screen === 'racing' ? 'block' : 'hidden'}`}
      />

      {/* In-Game HUD overlay */}
      {screen === 'racing' && (
        <HUD
          speed={hudData.speed}
          lap={hudData.lap}
          totalLaps={hudData.totalLaps}
          position={hudData.position}
          totalRacers={hudData.totalRacers}
          currentItem={hudData.currentItem}
          isDrifting={hudData.isDrifting}
          hasTurbo={hudData.hasTurbo}
          hasShield={hudData.hasShield}
          isWrongWay={hudData.isWrongWay}
          currentLapTime={hudData.currentLapTime}
          bestLapTime={hudData.bestLapTime}
          driftCharge={hudData.driftCharge}
          combatEvents={combatEvents}
          countdownText={countdownText}
          minimapData={minimapData}
          onUseItem={() => {
            if (engineRef.current) {
              const localRacer = (engineRef.current as any).racers.find(
                (r: any) => r.id === engineRef.current?.localPlayerId
              );
              if (localRacer) engineRef.current.firePowerUp(localRacer);
            }
          }}
          onHonk={() => soundManager.playHonk()}
          onLookBehindToggle={(active) => {
            if (engineRef.current) engineRef.current.localInput.lookBehind = active;
          }}
          onRespawn={() => {
            if (engineRef.current) engineRef.current.localInput.respawn = true;
          }}
          onInputStart={handleTouchInputStart}
          onInputEnd={handleTouchInputEnd}
        />
      )}

      {/* Menus and UI Overlays (when not racing) */}
      {screen !== 'racing' && (
        <div className="absolute inset-0 z-30 flex flex-col justify-between p-4 md:p-8 bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 overflow-y-auto">
          {/* Top Branding Header */}
          <div className="flex items-center justify-between max-w-5xl w-full mx-auto">
            <div className="flex items-center gap-3">
              <span className="text-4xl animate-bounce">🏎️</span>
              <div>
                <h1 className="text-3xl md:text-5xl font-black tracking-tight font-['Titan_One',sans-serif] bg-gradient-to-r from-amber-400 via-orange-400 to-red-500 bg-clip-text text-transparent drop-shadow-sm">
                  TOON CAR RACING 3D
                </h1>
                <p className="text-xs text-amber-300 font-bold tracking-wide">
                  Arcade Võidusõit • Relvad & Power-up'id • Drift • Multiplayer & AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowControls(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-bold border border-slate-700 cursor-pointer shadow-md transition-transform hover:scale-105"
              >
                <HelpCircle className="w-4 h-4" /> Juhend
              </button>
            </div>
          </div>

          {/* Main Menu Center Content */}
          <div className="my-auto py-6 flex flex-col items-center justify-center">
            {screen === 'menu' && (
              <div className="max-w-xl w-full space-y-4 text-center">
                {/* Active Player Setup Card */}
                <div className="bg-slate-900/90 border-2 border-amber-400/40 rounded-2xl p-5 shadow-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4 text-left">
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner border-2 border-white/20"
                      style={{ backgroundColor: selectedColor }}
                    >
                      {selectedCar.driverAvatar}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Sinu sõiduk:
                      </div>
                      <div className="text-lg font-black text-white">{selectedCar.name}</div>
                      <div className="text-xs text-amber-400 font-semibold">
                        Juht: {selectedCar.driverName}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setScreen('car_select')}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 cursor-pointer transition-transform hover:scale-105"
                  >
                    <Car className="w-4 h-4 text-amber-400" /> Muuda autot
                  </button>
                </div>

                {/* Main Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Single Player Button */}
                  <button
                    id="btn-singleplayer"
                    onClick={() => {
                      setIsMultiplayer(false);
                      setScreen('track_select');
                    }}
                    className="py-5 px-6 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-lg flex flex-col items-center justify-center gap-2 border-3 border-yellow-200 shadow-2xl transition-all duration-200 hover:scale-[1.03] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Play className="w-6 h-6 fill-current" />
                      <span>ÜKSIKMÄNG (AI VASTU)</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900/80">
                      Sõida 5 cartoon AI roboti vastu valitud rajal!
                    </span>
                  </button>

                  {/* Multiplayer Lobby Button */}
                  <button
                    id="btn-multiplayer"
                    onClick={() => {
                      setScreen('lobby');
                    }}
                    className="py-5 px-6 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-lg flex flex-col items-center justify-center gap-2 border-3 border-emerald-300 shadow-2xl transition-all duration-200 hover:scale-[1.03] cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="w-6 h-6" />
                      <span>MITMIKMÄNG (TOAD)</span>
                    </div>
                    <span className="text-xs font-semibold text-slate-900/80">
                      Loo tuba või liitu sõpradega üle võrgu!
                    </span>
                  </button>
                </div>

                {/* Quick Info Badges */}
                <div className="pt-2 flex flex-wrap justify-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> 8 Power-up eset (Raketid, Miinid, Kilp jne)
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
                    <Trophy className="w-3.5 h-3.5 text-sky-400" /> 4 teemarada: Rand, Kummitusloss, Küber, Jäätipp
                  </span>
                  <span className="flex items-center gap-1 bg-slate-900/60 px-3 py-1 rounded-full border border-slate-800">
                    ⚡ 50cc / 100cc / 150cc & Karikasari
                  </span>
                </div>
              </div>
            )}

            {/* Car Select Screen */}
            {screen === 'car_select' && (
              <div className="w-full">
                <CarSelect
                  selectedCarId={selectedCarId}
                  selectedColor={selectedColor}
                  customization={customization}
                  onSelectCar={setSelectedCarId}
                  onSelectColor={setSelectedColor}
                  onUpdateCustomization={(c) => setCustomization(prev => ({ ...prev, ...c }))}
                />
                <div className="mt-4 text-center">
                  <button
                    onClick={() => setScreen('menu')}
                    className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-transform hover:scale-105"
                  >
                    Salvesta ja tagasi
                  </button>
                </div>
              </div>
            )}

            {/* Track Select Screen */}
            {screen === 'track_select' && (
              <div className="w-full">
                <TrackSelect
                  selectedTrackId={selectedTrackId}
                  selectedLaps={selectedLaps}
                  gameMode={gameMode}
                  speedClass={speedClass}
                  onSelectTrack={setSelectedTrackId}
                  onSelectLaps={setSelectedLaps}
                  onSelectGameMode={setGameMode}
                  onSelectSpeedClass={setSpeedClass}
                />
                <div className="mt-4 flex gap-3 justify-center">
                  <button
                    onClick={() => setScreen('menu')}
                    className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
                  >
                    Tagasi
                  </button>
                  <button
                    id="btn-start-race"
                    onClick={handleStartGame}
                    className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-base flex items-center gap-2 cursor-pointer shadow-xl transition-transform hover:scale-105"
                  >
                    <Play className="w-5 h-5 fill-current" /> {gameMode === 'cup' ? 'ALUSTA KARIKASARJA!' : gameMode === 'timetrial' ? 'ALUSTA AJASÕITU!' : 'ALUSTA SÕITU!'}
                  </button>
                </div>
              </div>
            )}

            {/* Lobby Screen */}
            {screen === 'lobby' && (
              <Lobby
                currentRoom={currentRoom}
                playerName={playerName}
                selectedCarId={selectedCarId}
                selectedColor={selectedColor}
                onJoinRoom={handleJoinRoom}
                onCreateRoom={handleCreateRoom}
                onToggleReady={handleToggleReady}
                onStartRace={handleStartRace}
                onLeaveRoom={handleLeaveRoom}
                onSendMessage={handleSendMessage}
                chatMessages={chatMessages}
                onBack={() => setScreen('menu')}
              />
            )}
          </div>

          {/* Bottom Footer info */}
          <div className="max-w-5xl w-full mx-auto flex items-center justify-between text-xs text-slate-500 border-t border-slate-800/80 pt-3">
            <div>
              <span>Toon Car Racing 3D • Port 3000 • WebGL & WebSocket Ready</span>
            </div>
            <div>
              <span>Kasuta WASD või nooleklahve • Space: Drift • E: Ese</span>
            </div>
          </div>
        </div>
      )}

      {/* Post-Race Podium Results Modal */}
      {screen === 'results' && (
        <LeaderboardModal
          results={raceResults}
          gameMode={gameMode}
          cupStandings={cupStandings}
          cupStage={cupStageIndex + 1}
          totalCupStages={TRACK_DEFINITIONS.length}
          onNextCupStage={handleNextCupStage}
          onRestart={() => setScreen('racing')}
          onTrackSelect={() => setScreen('track_select')}
          onHome={() => setScreen('menu')}
        />
      )}

      {/* Controls & Powerups Help Modal */}
      {showControls && <ControlsHelpModal onClose={() => setShowControls(false)} />}
    </div>
  );
}
