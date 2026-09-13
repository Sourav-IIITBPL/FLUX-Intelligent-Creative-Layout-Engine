import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store/store';
import { SURFACES } from '../engine/types';
import { Search, X } from 'lucide-react';
import { cn } from '../lib/utils';

interface Command {
  label: string;
  description?: string;
  run: () => void;
  shortcut?: string;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const setActiveTab   = useStore(s => s.setActiveTab);
  const setSurface     = useStore(s => s.setSurface);
  const recalculate    = useStore(s => s.recalculate);
  const recalculateAll = useStore(s => s.recalculateAll);
  const resetLayout    = useStore(s => s.resetLayout);
  const toggleConstraints = useStore(s => s.toggleConstraints);

  const COMMANDS: Command[] = [
    { label: 'Open Editor',          shortcut: 'E',  run: () => setActiveTab('editor') },
    { label: 'Open Surface Matrix',  shortcut: 'M',  run: () => setActiveTab('matrix') },
    { label: 'Open Engine Lab',      shortcut: 'L',  run: () => setActiveTab('lab') },
    { label: 'Open Stress Test',     shortcut: 'S',  run: () => setActiveTab('stress') },
    { label: 'Open Accessibility',   shortcut: 'A',  run: () => setActiveTab('accessibility') },
    { label: 'Open R&D Tools',       shortcut: 'D',  run: () => setActiveTab('rdtools') },
    { label: 'Recalculate Layout',   shortcut: 'R',  run: () => { recalculate(); recalculateAll(); } },
    { label: 'Toggle Constraints',            run: toggleConstraints },
    { label: 'Reset Layout',                  run: resetLayout },
    { label: 'Switch → Desktop',              run: () => setSurface('desktop'), description: `${SURFACES.desktop.width}×${SURFACES.desktop.height}` },
    { label: 'Switch → Tablet',               run: () => setSurface('tablet'),  description: `${SURFACES.tablet.width}×${SURFACES.tablet.height}` },
    { label: 'Switch → Mobile',               run: () => setSurface('mobile'),  description: `${SURFACES.mobile.width}×${SURFACES.mobile.height}` },
    { label: 'Switch → Story',                run: () => setSurface('story'),   description: `${SURFACES.story.width}×${SURFACES.story.height}` },
    { label: 'Switch → Square',               run: () => setSurface('square'),  description: `${SURFACES.square.width}×${SURFACES.square.height}` },
  ];

  const filtered = query.trim()
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(query.toLowerCase()))
    : COMMANDS;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(o => !o);
        setQuery('');
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const execute = (cmd: Command) => {
    cmd.run();
    setOpen(false);
    setQuery('');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800">
          <Search className="w-4 h-4 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search commands…"
            className="flex-1 bg-transparent text-zinc-100 placeholder-zinc-600 outline-none text-sm"
          />
          <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div className="py-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-sm text-zinc-600">No commands match.</div>
          )}
          {filtered.map((cmd, i) => (
            <button
              key={i}
              onClick={() => execute(cmd)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-zinc-800 transition-colors"
            >
              <div>
                <div className="text-sm text-zinc-200">{cmd.label}</div>
                {cmd.description && <div className="text-[11px] text-zinc-500 font-mono mt-0.5">{cmd.description}</div>}
              </div>
              {cmd.shortcut && (
                <kbd className="px-1.5 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-mono text-zinc-400">
                  {cmd.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-zinc-800 text-[10px] text-zinc-600">
          ⌘K to open · ↑↓ navigate · Enter to run · Esc to close
        </div>
      </div>
    </div>
  );
}
