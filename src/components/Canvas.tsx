import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../store/store';
import { CreativeElement, Surface } from '../engine/types';
import { getSafeZone } from '../engine/collision';
import { computeFontSize, DEFAULT_TYPOGRAPHY } from '../engine/typography';
import { cn } from '../lib/utils';

interface CanvasProps {
  surface: Surface;
  elements: CreativeElement[];
  compact?: boolean;
  onSelectElement?: (id: string | null) => void;
  selectedId?: string | null;
}

export const Canvas = React.memo(function Canvas({
  surface, elements, compact = false, onSelectElement, selectedId
}: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  const showConstraints     = useStore(s => s.showConstraints);
  const showSafeZone        = useStore(s => s.showSafeZone);
  const showFocalPoint      = useStore(s => s.showFocalPoint);
  const showBoundingBoxes   = useStore(s => s.showBoundingBoxes);
  const showInteractionZones = useStore(s => s.showInteractionZones);
  const currentResult       = useStore(s => s.currentResult);
  const collisions          = currentResult?.collisions ?? [];

  useEffect(() => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const pad = compact ? 4 : 32;
    const sx = (clientWidth  - pad) / surface.width;
    const sy = (clientHeight - pad) / surface.height;
    setScale(Math.min(sx, sy, compact ? 1 : 1));
  }, [surface, compact]);

  const safeZone = getSafeZone(surface);
  const activePresetId = useStore(s => s.activePresetId);

  // Accent color per preset
  const accentMap: Record<string, string> = {
    aura: 'rgba(99,102,241,0.15)',
    nexus: 'rgba(16,185,129,0.12)',
    lumen: 'rgba(245,158,11,0.12)',
  };
  const bgGrad = accentMap[activePresetId] ?? accentMap['aura'];

  return (
    <div
      ref={containerRef}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      onClick={() => onSelectElement?.(null)}
    >
      <div
        className="relative overflow-hidden shadow-2xl border border-zinc-800/80 shrink-0"
        style={{
          width: surface.width,
          height: surface.height,
          transform: `scale(${scale})`,
          transformOrigin: 'center center',
          background: `radial-gradient(ellipse at 60% 40%, ${bgGrad}, #09090b 70%)`,
        }}
      >
        {/* Grid dots background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        />

        {/* Safe zone overlay */}
        {(showSafeZone || showConstraints) && (
          <div
            className="absolute border border-dashed border-emerald-500/40 pointer-events-none z-50 transition-all duration-300"
            style={{ left: safeZone.x, top: safeZone.y, width: safeZone.width, height: safeZone.height }}
          >
            <span className="absolute top-2 left-2 text-[9px] text-emerald-500/60 font-mono tracking-widest">SAFE ZONE</span>
          </div>
        )}

        {/* Bleed zone (full canvas edge) */}
        {showConstraints && (
          <div className="absolute inset-0 border border-dashed border-red-500/20 pointer-events-none z-50">
            <span className="absolute bottom-1 right-2 text-[9px] text-red-500/40 font-mono">BLEED</span>
          </div>
        )}

        {/* Elements */}
        <AnimatePresence>
          {elements.map(el => {
            if (el.hidden) return null;
            const isSelected = selectedId === el.id;
            const isColliding = showConstraints && collisions.some(c => c.elementId1 === el.id || c.elementId2 === el.id);

            return (
              <motion.div
                key={el.id}
                layout
                animate={{ x: el.x, y: el.y, width: el.width, height: el.height, opacity: 1 }}
                initial={{ opacity: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 280, damping: 28 }}
                className={cn(
                  'absolute canvas-element',
                  isSelected && 'ring-2 ring-indigo-500 ring-offset-1 ring-offset-black/80 z-40',
                  isColliding && !isSelected && 'ring-1 ring-red-500/70 z-30',
                )}
                style={{ zIndex: el.visualPriority }}
                onClick={e => { e.stopPropagation(); onSelectElement?.(el.id); }}
              >
                <ElementRenderer el={el} surface={surface} showBoundingBoxes={showBoundingBoxes} showInteractionZones={showInteractionZones} showFocalPoint={showFocalPoint} />
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Surface label for compact mode */}
        {compact && (
          <div className="absolute bottom-2 left-3 text-[9px] font-mono text-zinc-500 pointer-events-none">
            {surface.width}×{surface.height}
          </div>
        )}
      </div>
    </div>
  );
});

// ─── Element Renderer ─────────────────────────────────────────────────────────

function ElementRenderer({
  el, surface, showBoundingBoxes, showInteractionZones, showFocalPoint
}: {
  el: CreativeElement;
  surface: Surface;
  showBoundingBoxes: boolean;
  showInteractionZones: boolean;
  showFocalPoint: boolean;
}) {
  const activePresetId = useStore(s => s.activePresetId);
  const accentPrimary = activePresetId === 'nexus' ? '#10b981' : activePresetId === 'lumen' ? '#f59e0b' : '#6366f1';

  switch (el.type) {
    case 'headline': {
      const size = computeFontSize(DEFAULT_TYPOGRAPHY['headline'] ?? { desktopSize: 96, tabletSize: 64, mobileSize: 40, storySize: 56, squareSize: 72, minSize: 28, maxSize: 120 }, surface);
      return (
        <div className="w-full h-full flex items-start overflow-hidden">
          <h1 style={{ fontSize: size, lineHeight: 0.92, fontWeight: 900, letterSpacing: '-0.04em', color: '#fff' }}>
            {el.content}
          </h1>
        </div>
      );
    }

    case 'subtitle': {
      const size = computeFontSize(DEFAULT_TYPOGRAPHY['subtitle'] ?? { desktopSize: 28, tabletSize: 22, mobileSize: 16, storySize: 20, squareSize: 24, minSize: 14, maxSize: 40 }, surface);
      return (
        <div className="w-full h-full flex items-start overflow-hidden">
          <p style={{ fontSize: size, color: '#a1a1aa', lineHeight: 1.4, fontWeight: 400 }}>
            {el.content}
          </p>
        </div>
      );
    }

    case 'cta': {
      const size = computeFontSize(DEFAULT_TYPOGRAPHY['cta'] ?? { desktopSize: 18, tabletSize: 16, mobileSize: 14, storySize: 16, squareSize: 16, minSize: 12, maxSize: 22 }, surface);
      return (
        <button
          className="w-full h-full flex items-center justify-center rounded-full font-bold uppercase tracking-widest transition-colors cursor-pointer relative overflow-hidden"
          style={{ fontSize: size, background: '#fff', color: '#000' }}
        >
          {showInteractionZones && (
            <div className="absolute inset-0 bg-blue-500/10 border border-blue-500/30 rounded-full pointer-events-none" />
          )}
          {el.content}
        </button>
      );
    }

    case 'product':
      return (
        <div className="w-full h-full relative">
          {/* Glow */}
          <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: accentPrimary }} />
          {/* Ring */}
          <div className="w-full h-full rounded-full border border-zinc-700/50 bg-zinc-900/60 flex items-center justify-center relative overflow-hidden shadow-2xl">
            {/* Spinning ring */}
            <div className="absolute w-3/4 h-3/4 rounded-full border-2 opacity-40"
              style={{ borderColor: `${accentPrimary}40`, borderTopColor: accentPrimary, animation: 'spin 12s linear infinite' }} />
            {/* Inner ring */}
            <div className="absolute w-1/2 h-1/2 rounded-full border opacity-20"
              style={{ borderColor: accentPrimary, animation: 'spin 8s linear infinite reverse' }} />
            {/* Core dot */}
            <div className="w-6 h-6 rounded-full shadow-lg" style={{ background: accentPrimary }} />
          </div>
          {/* Focal point */}
          {showFocalPoint && el.focalPoint && (
            <div
              className="absolute w-5 h-5 rounded-full border-2 border-orange-400 bg-orange-400/30 shadow-[0_0_12px_rgba(251,146,60,0.6)] pointer-events-none z-50"
              style={{ left: el.focalPoint.x - 10, top: el.focalPoint.y - 10 }}
            />
          )}
        </div>
      );

    case 'badge': {
      const size = computeFontSize(DEFAULT_TYPOGRAPHY['badge'] ?? { desktopSize: 12, tabletSize: 11, mobileSize: 10, storySize: 11, squareSize: 11, minSize: 10, maxSize: 14 }, surface);
      return (
        <div
          className="w-full h-full flex items-center justify-center font-bold tracking-widest uppercase rounded border"
          style={{ fontSize: size, color: accentPrimary, borderColor: `${accentPrimary}50`, background: `${accentPrimary}15` }}
        >
          {el.content}
        </div>
      );
    }

    case 'hotspot':
      return (
        <div className="w-full h-full rounded-full border-2 border-white/40 bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-sm relative group">
          <div className="w-2 h-2 rounded-full bg-white group-hover:scale-150 transition-transform" />
          {showInteractionZones && (
            <div className="absolute -inset-3 rounded-full border border-dashed border-blue-400/40 pointer-events-none" />
          )}
        </div>
      );

    case 'decorative':
      return (
        <div
          className="w-full h-full pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 50% 50%, ${accentPrimary}18, transparent 70%)` }}
        />
      );

    default:
      return null;
  }
}
