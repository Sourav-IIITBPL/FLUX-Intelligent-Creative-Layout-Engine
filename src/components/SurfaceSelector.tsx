import React from 'react';
import { useStore } from '../store/store';
import { SURFACES, SurfaceType } from '../engine/types';
import { Monitor, Tablet, Smartphone, BookOpen, Square } from 'lucide-react';
import { cn } from '../lib/utils';

const ICONS: Record<SurfaceType, React.FC<{ className?: string }>> = {
  desktop: Monitor,
  tablet: Tablet,
  mobile: Smartphone,
  story: BookOpen,
  square: Square,
};

export function SurfaceSelector() {
  const current = useStore(s => s.currentSurfaceType);
  const setSurface = useStore(s => s.setSurface);
  const viewportWidth = useStore(s => s.viewportWidth);
  const setViewportWidth = useStore(s => s.setViewportWidth);

  return (
    <div className="flex items-center gap-4">
      {/* Surface buttons */}
      <div className="flex items-center gap-0.5 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
        {(Object.entries(SURFACES) as [SurfaceType, typeof SURFACES[SurfaceType]][]).map(([type, surface]) => {
          const Icon = ICONS[type];
          return (
            <button
              key={type}
              onClick={() => setSurface(type)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all text-[11px] font-semibold',
                current === type
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              )}
              title={`${surface.width}×${surface.height}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {surface.label}
            </button>
          );
        })}
      </div>

      {/* Continuous viewport slider */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 min-w-[200px]">
        <span className="shrink-0 font-mono text-[10px]">320</span>
        <input
          type="range" min={320} max={1920} step={1}
          value={viewportWidth}
          onChange={e => setViewportWidth(Number(e.target.value))}
          className="flex-1"
        />
        <span className="shrink-0 font-mono text-[10px] text-zinc-300 w-12 text-right">{viewportWidth}px</span>
      </div>
    </div>
  );
}
