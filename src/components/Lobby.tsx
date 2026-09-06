import React, { useState, useEffect } from 'react';
import { RoomInfo, RoomPlayer } from '../types';
import { TRACK_DEFINITIONS } from '../game/tracks';
import { CAR_DEFINITIONS } from '../game/cars';
import { Users, Play, Plus, ArrowLeft, Send, CheckCircle, Clock } from 'lucide-react';

interface LobbyProps {
  currentRoom: RoomInfo | null;
  playerName: string;
  selectedCarId: string;
  selectedColor: string;
  onJoinRoom: (roomId: string) => void;
  onCreateRoom: (name: string, trackId: string, laps: number, maxPlayers: number) => void;
  onToggleReady: () => void;
  onStartRace: () => void;
  onLeaveRoom: () => void;
  onSendMessage: (text: string) => void;
  chatMessages: { sender: string; text: string }[];
  onBack: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  currentRoom,
  playerName,
  selectedCarId,
  selectedColor,
  onJoinRoom,
  onCreateRoom,
  onToggleReady,
  onStartRace,
  onLeaveRoom,
  onSendMessage,
  chatMessages,
  onBack,
}) => {
  const [rooms, setRooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New room form state
  const [newRoomName, setNewRoomName] = useState('Toon Karikas');
  const [newRoomTrack, setNewRoomTrack] = useState('sunny_beach');
  const [newRoomLaps, setNewRoomLaps] = useState(3);
  const [newRoomMax, setNewRoomMax] = useState(6);

  const [chatInput, setChatInput] = useState('');

  // Fetch rooms list from API
  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/rooms');
      if (res.ok) {
        const data = await res.json();
        setRooms(data);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!currentRoom) {
      fetchRooms();
      const interval = setInterval(fetchRooms, 3000);
      return () => clearInterval(interval);
    }
  }, [currentRoom]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const getCarAvatar = (carId: string) => {
    return CAR_DEFINITIONS.find(c => c.id === carId)?.driverAvatar || '🏎️';
  };

  const getTrackName = (trackId: string) => {
    return TRACK_DEFINITIONS.find(t => t.id === trackId)?.name || trackId;
  };

  // 1. In-Room View
  if (currentRoom) {
    const isHost = currentRoom.players.some(p => p.name === playerName && p.isHost);
    const localPlayer = currentRoom.players.find(p => p.name === playerName);

    return (
      <div id="room-view" className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border-2 border-emerald-400/40 shadow-2xl max-w-4xl w-full mx-auto text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏁</span>
              <h2 className="text-2xl font-black font-['Titan_One',sans-serif] text-emerald-400">
                {currentRoom.name}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Rada: <span className="text-sky-300 font-bold">{getTrackName(currentRoom.trackId)}</span> • {currentRoom.laps} ringi • Maks {currentRoom.maxPlayers} sõitjat
            </p>
          </div>
          <button
            onClick={onLeaveRoom}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all cursor-pointer"
          >
            Lahku toast
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Players in Room */}
          <div className="md:col-span-7 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              Sõitjad toas ({currentRoom.players.length} / {currentRoom.maxPlayers}):
            </h3>

            <div className="space-y-2">
              {currentRoom.players.map((p, idx) => (
                <div
                  key={p.id || idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getCarAvatar(p.carId)}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white">{p.name}</span>
                        {p.isHost && (
                          <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-1.5 py-0.5 rounded">
                            HOST 👑
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div
                          className="w-3 h-3 rounded-full border border-white/40"
                          style={{ backgroundColor: p.color }}
                        />
                        <span className="text-xs text-slate-400 font-medium">
                          {CAR_DEFINITIONS.find(c => c.id === p.carId)?.name || 'Auto'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {p.isReady ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/40">
                        <CheckCircle className="w-3.5 h-3.5" /> VALMIS
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/40">
                        <Clock className="w-3.5 h-3.5" /> OOTEL
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-950/40 border border-slate-800/80 rounded-xl text-xs text-slate-400">
              💡 Kui toas on vabu kohti, täidab server puuduvad kohad automaatselt cartoon AI robotitega!
            </div>
          </div>

          {/* Chat & Ready / Start Controls */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            {/* Mini Chat */}
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 flex flex-col h-56">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-800/80 pb-1">
                Toa vestlus
              </div>
              <div className="flex-1 overflow-y-auto space-y-1 text-xs pr-1">
                {chatMessages.length === 0 ? (
                  <div className="text-slate-500 italic text-center py-6">Saada sõnum või tervita teisi!</div>
                ) : (
                  chatMessages.map((msg, i) => (
                    <div key={i} className="text-slate-300">
                      <span className="font-bold text-amber-400">{msg.sender}:</span> {msg.text}
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleSendChat} className="flex gap-2 mt-2 pt-2 border-t border-slate-800">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Kirjuta siia..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
                />
                <button
                  type="submit"
                  className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={onToggleReady}
                className={`w-full py-3 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-lg ${
                  localPlayer?.isReady
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-2 border-slate-600'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-2 border-emerald-300'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {localPlayer?.isReady ? 'Märgi: Pole valmis' : 'Mina olen valmis!'}
              </button>

              {isHost && (
                <button
                  onClick={onStartRace}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] cursor-pointer shadow-xl border-2 border-yellow-200"
                >
                  <Play className="w-4 h-4 fill-current" />
                  KÄIVITA VÕIDUSÕIT!
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Room Browser List View
  return (
    <div id="lobby-browser" className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border-2 border-emerald-400/40 shadow-2xl max-w-4xl w-full mx-auto text-white">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-black font-['Titan_One',sans-serif] text-emerald-400">
              VÕRGUMÄNGU LOBBY
            </h2>
            <p className="text-xs text-slate-400">
              Liitu teiste mängijate toaga või loo oma privaatne võistlus!
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-transform hover:scale-105 cursor-pointer shadow-lg"
        >
          <Plus className="w-4 h-4" /> Loo uus tuba
        </button>
      </div>

      {/* Rooms Table */}
      <div className="space-y-2">
        {rooms.length === 0 ? (
          <div className="text-center py-12 text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
            <span className="text-4xl block mb-2">🏁</span>
            <p className="font-bold">Hetkel avatud tubasid pole.</p>
            <p className="text-xs text-slate-500 mt-1">Klõpsa "Loo uus tuba", et alustada võistlust!</p>
          </div>
        ) : (
          rooms.map(room => (
            <div
              key={room.id}
              className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-xl p-3.5 flex items-center justify-between transition-all"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base">🏎️</span>
                  <span className="font-black text-sm text-white">{room.name}</span>
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Rada: <span className="text-sky-300 font-bold">{getTrackName(room.trackId)}</span> • {room.laps} ringi
                </div>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-emerald-400" />
                  {room.playerCount} / {room.maxPlayers}
                </span>

                <button
                  onClick={() => onJoinRoom(room.id)}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-transform hover:scale-105 cursor-pointer shadow"
                >
                  Liitu
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-400 rounded-2xl p-6 max-w-md w-full shadow-2xl text-white">
            <h3 className="text-xl font-black font-['Titan_One',sans-serif] text-emerald-400 mb-4">
              LOO UUS TOON VÕIDUSÕIT
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Toa nimi:</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={e => setNewRoomName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Vali rada:</label>
                <select
                  value={newRoomTrack}
                  onChange={e => setNewRoomTrack(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                >
                  {TRACK_DEFINITIONS.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.difficulty})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Ringide arv:</label>
                  <select
                    value={newRoomLaps}
                    onChange={e => setNewRoomLaps(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value={2}>2 ringi (Kiire)</option>
                    <option value={3}>3 ringi (Standard)</option>
                    <option value={5}>5 ringi (Maraton)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Maks. sõitjaid:</label>
                  <select
                    value={newRoomMax}
                    onChange={e => setNewRoomMax(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
                  >
                    <option value={2}>2 sõitjat</option>
                    <option value={4}>4 sõitjat</option>
                    <option value={6}>6 sõitjat</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Katkesta
              </button>
              <button
                onClick={() => {
                  onCreateRoom(newRoomName, newRoomTrack, newRoomLaps, newRoomMax);
                  setShowCreateModal(false);
                }}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs cursor-pointer shadow-lg"
              >
                Loo tuba!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
