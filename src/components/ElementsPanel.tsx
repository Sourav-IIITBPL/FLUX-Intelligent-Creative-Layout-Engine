import React from 'react';
import { useStore } from '../store/store';
import { CreativeElement } from '../engine/types';
import {
  Type, Image, MessageSquare, Tag, Circle, Crosshair, EyeOff, Lock
} from 'lucide-react';
import { cn } from '../lib/utils';

const ICONS: Record<CreativeElement['type'], React.FC<{ className?: string }>> = {
  headline:   Type,
  subtitle:   Type,
  product:    Image,
  cta:        MessageSquare,
  badge:      Tag,
  decorative: Circle,
  hotspot:    Crosshair,
};

export function ElementsPanel() {
  const elements    = useStore(s => s.currentResult?.elements ?? []);
  const selectedId  = useStore(s => s.selectedElementId);
  const select      = useStore(s => s.selectElement);

  return (
    <div className="px-1 py-1">
      {elements.map(el => {
        const Icon = ICONS[el.type];
        const isSelected = selectedId === el.id;
        return (
          <button
            key={el.id}
            onClick={() => select(el.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-left transition-all text-sm',
              isSelected
                ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent',
              el.hidden && 'opacity-40'
            )}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span className="flex-1 capitalize text-[12px] font-medium">{el.label}</span>
            <div className="flex items-center gap-1">
              {el.hidden  && <EyeOff className="w-3 h-3 text-zinc-600" />}
              {el.locked  && <Lock   className="w-3 h-3 text-zinc-600" />}
              <span className="text-[10px] font-mono text-zinc-600">{el.visualPriority}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
