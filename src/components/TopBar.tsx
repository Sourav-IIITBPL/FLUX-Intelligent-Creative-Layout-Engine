import React from 'react';
import { useStore } from '../store/store';
import { PRESETS } from '../data/presets';
import { SURFACES } from '../engine/types';
import {
  Zap, Layers, Grid2x2, TestTube2, Activity, Accessibility,
  Cpu, RotateCcw, Command, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { id: 'editor',        label: 'EDITOR',       icon: Layers,        shortcut: 'E' },
  { id: 'matrix',        label: 'MATRIX',       icon: Grid2x2,       shortcut: 'M' },
  { id: 'lab',           label: 'ENGINE LAB',   icon: TestTube2,     shortcut: 'L' },
  { id: 'stress',        label: 'STRESS TEST',  icon: Activity,      shortcut: 'S' },
  { id: 'accessibility', label: 'A11Y',          icon: Accessibility, shortcut: 'A' },
  { id: 'rdtools',       label: 'R&D TOOLS',    icon: Cpu,           shortcut: 'D' },
] as const;

export function TopBar() {
  const activeTab    = useStore(s => s.activeTab);
  const setActiveTab = useStore(s => s.setActiveTab);
  const activePreset = useStore(s => s.activePresetId);
  const setPreset    = useStore(s => s.setPreset);
  const currentResult = useStore(s => s.currentResult);
  const resetLayout  = useStore(s => s.resetLayout);

  const score = currentResult?.score ?? 0;

  return (
    <header className="h-11 shrink-0 border-b border-zinc-800 bg-zinc-900 flex items-center px-4 gap-6 z-50">
      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
          <Zap className="w-3.5 h-3.5 text-white fill-white" />
        </div>
        <div className="leading-none">
          <span className="text-[13px] font-bold text-zinc-100 tracking-tight">FLUX</span>
          <span className="text-[9px] text-zinc-500 uppercase tracking-widest ml-1.5">Creative Intelligence</span>
        </div>
      </div>

      <div className="w-px h-5 bg-zinc-800" />

      {/* Preset selector */}
      <div className="flex items-center gap-1">
        {PRESETS.map(p => (
          <button
            key={p.id}
            onClick={() => setPreset(p.id)}
            className={cn(
              'px-2.5 py-1 rounded text-[11px] font-semibold tracking-wide transition-all',
              activePreset === p.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300'
            )}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-zinc-800" />

      {/* Navigation */}
      <nav className="flex items-center gap-0.5 flex-1">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] font-semibold tracking-widest transition-all',
              activeTab === item.id
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            )}
            title={`Shortcut: ${item.shortcut}`}
          >
            <item.icon className="w-3.5 h-3.5" />
            {item.label}
          </button>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Score pill */}
        <div className={cn(
          'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold font-mono border',
          score >= 90 ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
          score >= 70 ? 'text-yellow-400 border-yellow-500/30 bg-yellow-500/10' :
                        'text-red-400 border-red-500/30 bg-red-500/10'
        )}>
          {score} / 100
        </div>

        {/* Reset */}
        <button
          onClick={resetLayout}
          className="w-7 h-7 rounded flex items-center justify-center text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          title="Reset Layout (R)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Status */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-medium text-emerald-400">Engine Live</span>
        </div>
      </div>
    </header>
  );
}
