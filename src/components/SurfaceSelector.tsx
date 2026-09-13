import React from 'react';
import { useStore } from '../store/store';
import { SURFACES, SurfaceType } from '../engine';
import { Monitor, Tablet, Smartphone, Maximize, Square } from 'lucide-react';
import { cn } from '../lib/utils';

const ICONS: Record<SurfaceType, React.ReactNode> = {
  desktop: <Monitor className="w-4 h-4" />,
  tablet: <Tablet className="w-4 h-4" />,
  mobile: <Smartphone className="w-4 h-4" />,
  story: <Maximize className="w-4 h-4" />,
  square: <Square className="w-4 h-4" />,
};

export function SurfaceSelector() {
  const currentSurfaceType = useStore(state => state.currentSurfaceType);
  const setSurface = useStore(state => state.setSurface);

  return (
    <div className="flex items-center gap-2 bg-zinc-950 p-1 rounded-lg border border-zinc-800">
      {(Object.entries(SURFACES) as [SurfaceType, typeof SURFACES[SurfaceType]][]).map(([type, surface]) => (
        <button
          key={type}
          onClick={() => setSurface(type)}
          className={cn(
            "flex flex-col items-center gap-1.5 px-4 py-2 rounded-md transition-all",
            currentSurfaceType === type
              ? "bg-zinc-800 text-zinc-100 shadow-sm"
              : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
          )}
          title={`${surface.width}x${surface.height}`}
        >
          {ICONS[type]}
          <span className="text-[10px] font-medium uppercase tracking-wider">{surface.label}</span>
        </button>
      ))}
    </div>
  );
}
