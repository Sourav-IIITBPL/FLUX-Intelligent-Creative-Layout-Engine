import React from 'react';
import { useStore } from '../store/store';
import { Type, Image, MessageSquare, Tag, Eye, Move, AlertCircle, Circle, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { ElementType } from '../engine';

const ICONS: Record<ElementType, React.ReactNode> = {
  headline: <Type className="w-4 h-4" />,
  subtitle: <Type className="w-4 h-4" />,
  product: <ImageIcon className="w-4 h-4" />,
  cta: <MessageSquare className="w-4 h-4" />,
  badge: <Tag className="w-4 h-4" />,
  decorative: <Circle className="w-4 h-4" />,
  hotspot: <AlertCircle className="w-4 h-4" />,
};

export function ElementsPanel() {
  const elements = useStore(state => state.currentResult?.elements || []);
  const selectedId = useStore(state => state.selectedElementId);
  const selectElement = useStore(state => state.selectElement);

  return (
    <div className="flex flex-col p-2 gap-1">
      {elements.map(el => (
        <button
          key={el.id}
          onClick={() => selectElement(el.id)}
          className={cn(
            "flex items-center justify-between p-2 rounded-md text-sm transition-colors text-left",
            selectedId === el.id 
              ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30" 
              : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent"
          )}
        >
          <div className="flex items-center gap-3">
            <span className="text-zinc-500">{ICONS[el.type]}</span>
            <span className="capitalize font-medium">{el.type}</span>
          </div>
          {el.hidden && <Eye className="w-3.5 h-3.5 text-zinc-600 line-through" />}
        </button>
      ))}
    </div>
  );
}
