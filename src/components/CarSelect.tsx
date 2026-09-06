import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { CAR_DEFINITIONS, createToonCarMesh } from '../game/cars';
import { CarDefinition, CarCustomization, FinishType, RimStyle, UnderglowColor } from '../types';
import { Shield, Zap, Gauge, Compass, Wrench, Sparkles } from 'lucide-react';

interface CarSelectProps {
  selectedCarId: string;
  selectedColor: string;
  customization: CarCustomization;
  onSelectCar: (carId: string) => void;
  onSelectColor: (color: string) => void;
  onUpdateCustomization: (customization: Partial<CarCustomization>) => void;
}

const COLOR_PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#facc15', // Yellow
  '#22c55e', // Green
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#18181b', // Midnight Black
  '#ffffff', // Pure White
];

const UNDERGLOW_OPTIONS: { id: UnderglowColor; label: string; color: string }[] = [
  { id: 'none', label: 'Väljas', color: '#334155' },
  { id: '#06b6d4', label: 'Tsüaan', color: '#06b6d4' },
  { id: '#22c55e', label: 'Roheline', color: '#22c55e' },
  { id: '#ec4899', label: 'Roosa', color: '#ec4899' },
  { id: '#eab308', label: 'Kuldne', color: '#eab308' },
  { id: '#a855f7', label: 'Lilla', color: '#a855f7' },
];

export const CarSelect: React.FC<CarSelectProps> = ({
  selectedCarId,
  selectedColor,
  customization,
  onSelectCar,
  onSelectColor,
  onUpdateCustomization,
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'tuning'>('stats');
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const selectedCar = CAR_DEFINITIONS.find(c => c.id === selectedCarId) || CAR_DEFINITIONS[0];

  // 3D Preview of Selected Car
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 240;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(3.5, 2.2, 4.5);
    camera.lookAt(0, 0.6, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xfffaed, 2.0);
    dir.position.set(5, 10, 7);
    scene.add(dir);

    // Pedestal
    const pedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(2.4, 2.6, 0.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.6 })
    );
    pedestal.position.y = -0.1;
    scene.add(pedestal);

    // Car with full customization
    const carContainer = createToonCarMesh(selectedCar, selectedColor, customization);
    scene.add(carContainer.root);

    let frameId: number;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      carContainer.root.rotation.y += 0.015;
      carContainer.driverHead.rotation.z = Math.sin(Date.now() * 0.005) * 0.15;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [selectedCar, selectedColor, customization]);

  return (
    <div id="car-select-screen" className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-6 border-2 border-amber-400/40 shadow-2xl max-w-4xl w-full mx-auto text-white">
      <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-2xl font-black tracking-wide text-amber-400 font-['Titan_One',sans-serif]">
            VALI CARTOON AUTO JA JUHT
          </h2>
          <p className="text-sm text-slate-400">
            Igal sõidukil on oma erilised cartoon-oskused ja sõidutunnetus!
          </p>
        </div>
        <div className="text-3xl">{selectedCar.driverAvatar}</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Car Models List */}
        <div className="md:col-span-4 space-y-2">
          {CAR_DEFINITIONS.map(car => {
            const isSelected = car.id === selectedCarId;
            return (
              <button
                key={car.id}
                id={`btn-select-car-${car.id}`}
                onClick={() => {
                  onSelectCar(car.id);
                  onSelectColor(car.primaryColor);
                }}
                className={`w-full text-left p-3 rounded-xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-amber-400 bg-amber-500/20 shadow-lg scale-[1.02]'
                    : 'border-slate-800 bg-slate-800/50 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{car.driverAvatar}</span>
                  <div>
                    <div className="font-bold text-sm text-white">{car.name}</div>
                    <div className="text-xs text-amber-300 font-medium">{car.driverName}</div>
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full border border-white/40 shadow-inner"
                  style={{ backgroundColor: car.primaryColor }}
                />
              </button>
            );
          })}
        </div>

        {/* 3D Preview Canvas */}
        <div className="md:col-span-4 flex flex-col items-center justify-center bg-slate-950/60 rounded-xl border border-slate-800 p-4">
          <div ref={canvasContainerRef} className="w-full h-52 flex items-center justify-center" />
          <div className="text-center mt-2">
            <h3 className="text-lg font-black text-amber-400">{selectedCar.name}</h3>
            <p className="text-xs text-slate-300 italic mt-1">{selectedCar.description}</p>
          </div>

          {/* Color palette picker */}
          <div className="mt-4 w-full">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1.5 text-center">
              Kohanda värvi:
            </label>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {COLOR_PALETTE.map(color => (
                <button
                  key={color}
                  onClick={() => onSelectColor(color)}
                  className={`w-6 h-6 rounded-full border-2 transition-transform cursor-pointer ${
                    selectedColor === color ? 'border-white scale-125 shadow-md' : 'border-transparent hover:scale-110'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Car Stats & Driver Bio OR Tuning Controls */}
        <div className="md:col-span-4 space-y-3 flex flex-col justify-between">
          <div className="flex gap-2 p-1 bg-slate-950/80 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('stats')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'stats'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Gauge className="w-3.5 h-3.5" /> Andmed
            </button>
            <button
              onClick={() => setActiveTab('tuning')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'tuning'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" /> Tuuning & Neoon
            </button>
          </div>

          {activeTab === 'stats' ? (
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tehnilised andmed
              </h4>

              {/* Speed */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Gauge className="w-3.5 h-3.5 text-red-400" /> Tippkiirus
                  </span>
                  <span className="text-red-400">{selectedCar.stats.speed}/10</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-300"
                    style={{ width: `${selectedCar.stats.speed * 10}%` }}
                  />
                </div>
              </div>

              {/* Accel */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-amber-400" /> Kiirendus
                  </span>
                  <span className="text-amber-400">{selectedCar.stats.accel}/10</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${selectedCar.stats.accel * 10}%` }}
                  />
                </div>
              </div>

              {/* Handling */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Compass className="w-3.5 h-3.5 text-cyan-400" /> Juhitavus & Drift
                  </span>
                  <span className="text-cyan-400">{selectedCar.stats.handling}/10</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-400 rounded-full transition-all duration-300"
                    style={{ width: `${selectedCar.stats.handling * 10}%` }}
                  />
                </div>
              </div>

              {/* Armor */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" /> Rammimisjõud / Soomus
                  </span>
                  <span className="text-emerald-400">{selectedCar.stats.armor}/10</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                    style={{ width: `${selectedCar.stats.armor * 10}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800 space-y-3.5">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Kere & Neoon Tuuning
              </h4>

              {/* Finish */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                  Kere viimistlus:
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['gloss', 'metallic', 'matte'] as FinishType[]).map(f => (
                    <button
                      key={f}
                      onClick={() => onUpdateCustomization({ finish: f })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer border ${
                        customization.finish === f
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {f === 'gloss' ? 'Läikiv' : f === 'metallic' ? 'Metallik' : 'Matt'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rim style */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                  Velgede stiil:
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['sport', 'gold', 'cyber', 'monster'] as RimStyle[]).map(r => (
                    <button
                      key={r}
                      onClick={() => onUpdateCustomization({ rimStyle: r })}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer border ${
                        customization.rimStyle === r
                          ? 'bg-amber-400/20 border-amber-400 text-amber-300 shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {r === 'sport' ? 'Hõbe Sport' : r === 'gold' ? 'Kuldne VIP' : r === 'cyber' ? 'Küber Neoon' : 'Monster'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Underglow */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase block mb-1.5">
                  Põhjavalgus (Neoon):
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {UNDERGLOW_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => onUpdateCustomization({ underglow: opt.id })}
                      className={`py-1 px-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        customization.underglow === opt.id
                          ? 'bg-amber-400/20 border-amber-400 text-white shadow-sm'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shadow-inner shrink-0"
                        style={{ backgroundColor: opt.color }}
                      />
                      <span className="truncate text-[11px]">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-center gap-2">
            <span className="text-xl">💡</span>
            <span>Drifti vajutades pöörab auto teravamalt ja laeb mini-turbo sööstu!</span>
          </div>
        </div>
      </div>
    </div>
  );
};
