import React, { useRef, useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { getSafeZone, SAFE_ZONE_PADDING } from '../engine';

export function Canvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  
  const result = useStore(state => state.currentResult);
  const selectedId = useStore(state => state.selectedElementId);
  const selectElement = useStore(state => state.selectElement);
  const showConstraints = useStore(state => state.showConstraints);

  useEffect(() => {
    if (!containerRef.current || !result) return;
    
    const container = containerRef.current;
    const { width, height } = result.surface;
    
    // Calculate scale to fit canvas in container with padding
    const padding = 64;
    const scaleX = (container.clientWidth - padding) / width;
    const scaleY = (container.clientHeight - padding) / height;
    
    setScale(Math.min(scaleX, scaleY, 1));
  }, [result?.surface]);

  if (!result) return null;

  const { surface, elements, collisions } = result;
  const safeZone = getSafeZone(surface);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full flex items-center justify-center cursor-default"
      onClick={() => selectElement(null)}
    >
      <div 
        className="relative bg-black shadow-2xl overflow-hidden border border-zinc-800 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          width: surface.width,
          height: surface.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Background gradient if no explicit bg element fills it well */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black pointer-events-none" />

        {/* Safe Zone Overlay */}
        {showConstraints && (
          <div 
            className="absolute border-2 border-dashed border-emerald-500/50 pointer-events-none z-50 flex items-center justify-center transition-all duration-500"
            style={{
              left: safeZone.x,
              top: safeZone.y,
              width: safeZone.width,
              height: safeZone.height,
            }}
          >
            <span className="absolute top-2 left-2 text-[10px] text-emerald-500/80 font-mono tracking-wider">SAFE ZONE</span>
          </div>
        )}

        {/* Elements */}
        <AnimatePresence>
          {elements.map(el => {
            if (el.hidden) return null;
            
            const isSelected = selectedId === el.id;
            const isCollision = showConstraints && collisions.some(c => c.elementId1 === el.id || c.elementId2 === el.id);

            return (
              <motion.div
                key={el.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  x: el.x,
                  y: el.y,
                  width: el.width,
                  height: el.height
                }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                  "absolute flex items-center justify-center",
                  isSelected && "ring-2 ring-indigo-500 ring-offset-2 ring-offset-black z-40",
                  isCollision && "ring-2 ring-red-500 ring-offset-2 ring-offset-black z-30"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  selectElement(el.id);
                }}
                style={{ zIndex: el.priority }}
              >
                {/* Element Renderers */}
                {el.type === 'headline' && (
                  <h1 className="text-white font-bold tracking-tight w-full h-full text-[clamp(24px,8vw,120px)] leading-none text-left flex items-start">
                    {el.content}
                  </h1>
                )}
                
                {el.type === 'subtitle' && (
                  <p className="text-zinc-400 font-medium w-full h-full text-[clamp(14px,3vw,32px)] leading-tight text-left">
                    {el.content}
                  </p>
                )}
                
                {el.type === 'cta' && (
                  <button className="w-full h-full bg-white text-black font-bold uppercase tracking-wider text-[clamp(12px,1.5vw,18px)] rounded-full hover:bg-zinc-200 transition-colors cursor-pointer flex items-center justify-center">
                    {el.content}
                  </button>
                )}
                
                {el.type === 'product' && (
                  <div className="w-full h-full relative">
                    <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-full blur-3xl" />
                    <div className="w-full h-full rounded-full border border-zinc-800 bg-zinc-900/50 flex items-center justify-center shadow-2xl relative overflow-hidden">
                       <div className="w-3/4 h-3/4 rounded-full border-4 border-indigo-500/30 border-t-indigo-500 animate-[spin_10s_linear_infinite]" />
                       <div className="absolute inset-0 flex items-center justify-center flex-col">
                          <span className="text-zinc-600 font-mono text-sm">PRODUCT_RENDER</span>
                       </div>
                    </div>
                    {/* Focal point visualizer */}
                    {showConstraints && el.focalPoint && (
                      <div 
                        className="absolute w-4 h-4 rounded-full bg-red-500 shadow-[0_0_10px_red] pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2"
                        style={{ left: el.focalPoint.x, top: el.focalPoint.y }}
                      />
                    )}
                  </div>
                )}
                
                {el.type === 'badge' && (
                  <div className="w-full h-full bg-indigo-500/20 border border-indigo-500/50 text-indigo-300 font-bold tracking-wider text-[clamp(10px,1vw,14px)] rounded flex items-center justify-center whitespace-nowrap">
                    {el.content}
                  </div>
                )}
                
                {el.type === 'hotspot' && (
                  <div className="w-full h-full bg-white/10 border-2 border-white/50 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer backdrop-blur-sm group">
                    <div className="w-2 h-2 bg-white rounded-full group-hover:scale-150 transition-transform" />
                  </div>
                )}

                {el.type === 'decorative' && (
                  <div className="w-full h-full opacity-30 bg-gradient-to-br from-indigo-500/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                )}
                
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
