import React from 'react';
import { X, Gamepad2 } from 'lucide-react';
import { POWER_UPS } from '../game/powerups';

interface ControlsHelpModalProps {
  onClose: () => void;
}

export const ControlsHelpModal: React.FC<ControlsHelpModalProps> = ({ onClose }) => {
  return (
    <div id="controls-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 md:p-8 max-w-2xl w-full shadow-2xl text-white max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-6 h-6 text-amber-400" />
            <h3 className="text-2xl font-black font-['Titan_One',sans-serif] text-amber-400">
              JUHTIMINE JA POWER-UPID
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Klaviatuuri juhtimine
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Gaas / Edasi:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-amber-400 font-bold">W / Nool Üles</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Pidur / Tagurpidi:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-amber-400 font-bold">S / Nool Alla</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Pööramine:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-amber-400 font-bold">A / D või Nooled</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Drift / Külglibisemine:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-amber-400 font-bold">Shift</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Eseme kasutamine:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-emerald-400 font-bold">E / Tühik</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Vaata seljataha:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-sky-400 font-bold">C</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Taasta auto rajale:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-amber-400 font-bold">R</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">Signaal / Tuututamine:</span>
                <span className="bg-slate-800 px-2 py-1 rounded font-mono text-amber-400 font-bold">H</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Mängumehaanika nipid
            </h4>
            <ul className="space-y-2 text-xs text-slate-300 list-disc list-inside">
              <li>
                <strong className="text-amber-400">Mini-Turbo sädemed:</strong> Hoia kurvis drifti: kollased sädemed (tase 1) annavad vabanedes kiirenduse, sinised leegid (tase 2) super-kiirenduse!
              </li>
              <li>
                <strong className="text-sky-400">Kiirenduspadjad:</strong> Sõida teel olevatest kollastest nooltest üle, et saada tasuta nitro!
              </li>
              <li>
                <strong className="text-emerald-400">Mullkilp:</strong> Kaitseb sind ühe raketi või miini eest ning võimaldab vastaseid teelt välja rammida.
              </li>
              <li>
                <strong className="text-purple-400">Koomiksi-alasi:</strong> Tabab alati võistluse esikohal olijat!
              </li>
            </ul>
          </div>
        </div>

        {/* Power-up Guide */}
        <div>
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Rajalt korjatavad esemed (Magic Boxes)
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            {Object.values(POWER_UPS).map(p => (
              <div key={p.type} className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-start gap-2">
                <span className="text-2xl">{p.icon}</span>
                <div>
                  <div className="font-bold text-white">{p.name}</div>
                  <div className="text-[10px] text-slate-400 leading-tight mt-0.5">{p.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm cursor-pointer shadow-lg transition-transform hover:scale-105"
          >
            Selge, lähme sõitma!
          </button>
        </div>
      </div>
    </div>
  );
};
