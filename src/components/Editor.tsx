import React from 'react';
import { ElementsPanel } from './ElementsPanel';
import { Canvas } from './Canvas';
import { Inspector } from './Inspector';
import { SurfaceSelector } from './SurfaceSelector';

export function Editor() {
  return (
    <div className="flex w-full h-full">
      {/* Left Panel */}
      <div className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Elements</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <ElementsPanel />
        </div>
      </div>

      {/* Center Canvas */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        <div className="flex-1 relative overflow-hidden flex items-center justify-center p-8 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-900 to-zinc-950">
          <Canvas />
        </div>
        
        {/* Bottom Bar */}
        <div className="h-16 border-t border-zinc-800 bg-zinc-900 flex items-center px-4 justify-center">
          <SurfaceSelector />
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-80 border-l border-zinc-800 bg-zinc-950 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Inspector</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          <Inspector />
        </div>
      </div>
    </div>
  );
}
