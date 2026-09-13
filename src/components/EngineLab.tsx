import React from 'react';
import { useStore } from '../store/store';
import { Settings, RefreshCw, Zap, Sliders } from 'lucide-react';

export function EngineLab() {
  const weights = useStore(state => state.weights);
  const setWeights = useStore(state => state.setWeights);
  const recalculate = useStore(state => state.recalculate);
  const resetLayout = useStore(state => state.resetLayout);

  const handleSliderChange = (key: keyof typeof weights, value: number) => {
    setWeights({ [key]: value });
  };

  return (
    <div className="w-full h-full flex flex-col items-center bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-2xl w-full">
        
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest mb-4">
            <Zap className="w-3 h-3" /> Experimental
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-white mb-2">Deterministic Layout Engine</h2>
          <p className="text-zinc-400 max-w-lg mx-auto text-sm">
            The current prototype uses deterministic constraint resolution. The scoring layer is designed to support future learned or AI-generated layout policies.
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-zinc-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Constraint Weights</h3>
          </div>
          
          <div className="p-6 space-y-8">
            <WeightSlider 
              label="Priority Adherence" 
              value={weights.priority} 
              onChange={(v: number) => handleSliderChange('priority', v)} 
              min={0} max={5} step={0.1}
            />
            <WeightSlider 
              label="Collision Penalty" 
              value={weights.collisionPenalty} 
              onChange={(v: number) => handleSliderChange('collisionPenalty', v)} 
              min={0} max={5} step={0.1}
            />
            <WeightSlider 
              label="Safe Zone Weight" 
              value={weights.safeZone} 
              onChange={(v: number) => handleSliderChange('safeZone', v)} 
              min={0} max={5} step={0.1}
            />
            <WeightSlider 
              label="Focal Point Weight" 
              value={weights.focalPoint} 
              onChange={(v: number) => handleSliderChange('focalPoint', v)} 
              min={0} max={5} step={0.1}
            />
            <WeightSlider 
              label="CTA Preservation Weight" 
              value={weights.ctaPreservation} 
              onChange={(v: number) => handleSliderChange('ctaPreservation', v)} 
              min={0} max={5} step={0.1}
            />
          </div>

          <div className="p-4 border-t border-zinc-800 bg-zinc-900/50 flex justify-end gap-3">
            <button 
              onClick={resetLayout}
              className="px-4 py-2 rounded-md text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Reset to Defaults
            </button>
            <button 
              onClick={recalculate}
              className="px-6 py-2 rounded-md text-sm font-bold bg-indigo-500 text-white hover:bg-indigo-600 shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" /> RECALCULATE LAYOUT
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

function WeightSlider({ label, value, onChange, min, max, step }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number, step: number }) {
  return (
    <div>
      <div className="flex justify-between mb-2 text-sm">
        <label className="font-medium text-zinc-300">{label}</label>
        <span className="font-mono text-zinc-500">{value.toFixed(1)}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        step={step} 
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
      />
    </div>
  );
}
