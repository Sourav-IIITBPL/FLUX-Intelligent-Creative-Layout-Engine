import React, { useEffect, useCallback } from 'react';
import { useStore } from './store/store';
import { Editor } from './components/Editor';
import { SurfaceMatrix } from './components/SurfaceMatrix';
import { EngineLab } from './components/EngineLab';
import { StressTest } from './components/StressTest';
import { AccessibilityScreen } from './components/AccessibilityScreen';
import { RDTools } from './components/RDTools';
import { CommandPalette } from './components/CommandPalette';
import { TopBar } from './components/TopBar';
import { cn } from './lib/utils';

export default function App() {
  const activeTab = useStore(s => s.activeTab);
  const recalculate = useStore(s => s.recalculate);
  const recalculateAll = useStore(s => s.recalculateAll);
  const undo = useStore(s => s.undo);
  const redo = useStore(s => s.redo);

  // Initialise on mount
  useEffect(() => {
    recalculate();
    recalculateAll();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Global keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const setTab = useStore.getState().setActiveTab;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;

    const meta = e.ctrlKey || e.metaKey;

    if (meta && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
    if (meta && (e.key === 'Z' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }

    switch (e.key.toLowerCase()) {
      case 'e': setTab('editor');        break;
      case 'm': setTab('matrix');        break;
      case 'l': setTab('lab');           break;
      case 's': setTab('stress');        break;
      case 'a': setTab('accessibility'); break;
      case 'd': setTab('rdtools');       break;
      case 'r': recalculate();           break;
    }
  }, [undo, redo, recalculate]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-300 select-none overflow-hidden">
      <TopBar />
      <main className="flex-1 overflow-hidden">
        {activeTab === 'editor'        && <Editor />}
        {activeTab === 'matrix'        && <SurfaceMatrix />}
        {activeTab === 'lab'           && <EngineLab />}
        {activeTab === 'stress'        && <StressTest />}
        {activeTab === 'accessibility' && <AccessibilityScreen />}
        {activeTab === 'rdtools'       && <RDTools />}
      </main>
      <CommandPalette />
    </div>
  );
}
