import React, { useCallback } from 'react';
import { useStore } from '../store/store';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import { ElementsPanel } from './ElementsPanel';
import { SurfaceSelector } from './SurfaceSelector';
import { SURFACES } from '../engine/types';

export function Editor() {
  const result          = useStore(s => s.currentResult);
  const selectedId      = useStore(s => s.selectedElementId);
  const selectElement   = useStore(s => s.selectElement);
  const currentSurface  = useStore(s => s.currentSurfaceType);

  const surface = SURFACES[currentSurface];
  const elements = result?.elements ?? [];

  return (
    <div className="flex w-full h-full overflow-hidden">
      {/* Left — Elements Panel */}
      <div className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800">
          <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Elements</h2>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          <ElementsPanel />
        </div>
      </div>

      {/* Center — Canvas + Surface bar */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(ellipse_at_50%_40%,_#1a1a2e_0%,_#09090b_70%)] flex items-center justify-center">
          <Canvas
            surface={surface}
            elements={elements}
            onSelectElement={selectElement}
            selectedId={selectedId}
          />
        </div>
        <div className="h-14 border-t border-zinc-800 bg-zinc-900/80 flex items-center justify-center px-4 gap-4 shrink-0">
          <SurfaceSelector />
        </div>
      </div>

      {/* Right — Inspector */}
      <div className="w-72 shrink-0 border-l border-zinc-800 bg-zinc-950 flex flex-col overflow-hidden">
        <div className="px-4 py-2.5 border-b border-zinc-800">
          <h2 className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Inspector</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Inspector />
        </div>
      </div>
    </div>
  );
}
