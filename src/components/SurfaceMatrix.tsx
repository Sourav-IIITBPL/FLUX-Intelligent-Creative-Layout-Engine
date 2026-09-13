import React from 'react';
import { useStore } from '../store/store';
import { Canvas } from './Canvas';
import { SURFACES, SurfaceType } from '../engine/types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const SURFACE_ORDER: SurfaceType[] = ['desktop', 'tablet', 'mobile', 'story', 'square'];

export function SurfaceMatrix() {
  const allResults    = useStore(s => s.allSurfaceResults);
  const selectedId    = useStore(s => s.selectedElementId);
  const selectElement = useStore(s => s.selectElement);
  const recalculateAll = useStore(s => s.recalculateAll);

  React.useEffect(() => { recalculateAll(); }, []); // eslint-disable-line

  return (
    <div className="w-full h-full bg-zinc-950 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-sm font-bold text-zinc-100">Surface Matrix</h2>
          <p className="text-xs text-zinc-500 mt-0.5">All derived layouts — same source, constraint-adapted</p>
        </div>
        <button
          onClick={recalculateAll}
          className="px-4 py-1.5 text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded hover:bg-indigo-500/30 transition-colors"
        >
          Recalculate All
        </button>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-auto p-6">
        <div className="grid grid-cols-2 gap-4 h-full" style={{ gridTemplateRows: '1fr 1fr' }}>
          {/* Desktop — large */}
          <SurfaceCard
            surfaceType="desktop"
            result={allResults['desktop']}
            selectedId={selectedId}
            onSelect={selectElement}
            className="col-span-2 row-span-1"
          />
          {/* Tablet */}
          <SurfaceCard
            surfaceType="tablet"
            result={allResults['tablet']}
            selectedId={selectedId}
            onSelect={selectElement}
          />
          {/* Mobile + Story + Square in a row */}
          <div className="grid grid-cols-3 gap-3">
            {(['mobile', 'story', 'square'] as SurfaceType[]).map(type => (
              <SurfaceCard
                key={type}
                surfaceType={type}
                result={allResults[type]}
                selectedId={selectedId}
                onSelect={selectElement}
                compact
              />
            ))}
          </div>
        </div>
      </div>

      {/* Cross-surface score summary */}
      <div className="border-t border-zinc-800 px-6 py-3 shrink-0">
        <div className="flex items-center gap-6">
          <span className="text-xs text-zinc-500 font-semibold uppercase tracking-widest">Cross-Surface</span>
          {SURFACE_ORDER.map(type => {
            const r = allResults[type];
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs">
                <span className="text-zinc-500 capitalize">{SURFACES[type].label}</span>
                <span className={cn('font-mono font-bold', !r ? 'text-zinc-600' : r.score >= 90 ? 'text-emerald-400' : r.score >= 70 ? 'text-yellow-400' : 'text-red-400')}>
                  {r ? r.score : '—'}
                </span>
              </div>
            );
          })}
          <div className="ml-auto text-xs">
            <span className="text-zinc-500">Avg: </span>
            <span className="font-mono font-bold text-zinc-200">
              {SURFACE_ORDER.some(t => allResults[t])
                ? Math.round(SURFACE_ORDER.reduce((a, t) => a + (allResults[t]?.score ?? 0), 0) / SURFACE_ORDER.filter(t => allResults[t]).length)
                : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SurfaceCard({
  surfaceType, result, selectedId, onSelect, compact = false, className
}: {
  surfaceType: SurfaceType;
  result: import('../engine/types').LayoutResult | undefined;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  compact?: boolean;
  className?: string;
}) {
  const surface = SURFACES[surfaceType];
  if (!result) {
    return (
      <div className={cn('border border-zinc-800 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-600 text-xs', className)}>
        Loading...
      </div>
    );
  }

  return (
    <div className={cn('border border-zinc-800 rounded-lg bg-zinc-900 overflow-hidden flex flex-col', className)}>
      {/* Card header */}
      <div className="px-3 py-2 border-b border-zinc-800/60 flex items-center justify-between bg-zinc-900/80 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-zinc-300">{surface.label}</span>
          <span className="text-[9px] font-mono text-zinc-600">{surface.width}×{surface.height}</span>
        </div>
        <div className="flex items-center gap-2">
          {result.collisions.length === 0
            ? <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            : <XCircle className="w-3 h-3 text-red-500" />}
          <span className={cn('text-[11px] font-mono font-bold',
            result.score >= 90 ? 'text-emerald-400' : result.score >= 70 ? 'text-yellow-400' : 'text-red-400'
          )}>{result.score}</span>
        </div>
      </div>
      {/* Canvas */}
      <div className="flex-1 overflow-hidden p-1">
        <Canvas
          surface={surface}
          elements={result.elements}
          compact={compact}
          onSelectElement={onSelect}
          selectedId={selectedId}
        />
      </div>
    </div>
  );
}
