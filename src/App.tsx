import React, { useState, useEffect } from 'react';
import { useStore } from './store/store';
import { Editor } from './components/Editor';
import { EngineLab } from './components/EngineLab';
import { StressTest } from './components/StressTest';
import { Layers, TestTube2, Activity, Zap } from 'lucide-react';
import { cn } from './lib/utils';

type Tab = 'editor' | 'lab' | 'stress';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('editor');
  const recalculate = useStore(state => state.recalculate);

  useEffect(() => {
    recalculate();
  }, [recalculate]);

  return (
    <div className="flex flex-col h-screen w-screen bg-zinc-950 text-zinc-300 font-sans">
      {/* Top Bar */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-900/50 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Zap className="w-4 h-4 text-white fill-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-zinc-100 leading-none">FLUX</h1>
            <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-wider">Intelligent Creative Engine</span>
          </div>
        </div>

        <nav className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-lg border border-zinc-800/50">
          <TabButton 
            active={activeTab === 'editor'} 
            onClick={() => setActiveTab('editor')}
            icon={<Layers className="w-4 h-4" />}
            label="EDITOR"
          />
          <TabButton 
            active={activeTab === 'lab'} 
            onClick={() => setActiveTab('lab')}
            icon={<TestTube2 className="w-4 h-4" />}
            label="ENGINE LAB"
          />
          <TabButton 
            active={activeTab === 'stress'} 
            onClick={() => setActiveTab('stress')}
            icon={<Activity className="w-4 h-4" />}
            label="STRESS TEST"
          />
        </nav>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-400">Engine Live</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'editor' && <Editor />}
        {activeTab === 'lab' && <EngineLab />}
        {activeTab === 'stress' && <StressTest />}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold tracking-wide transition-all duration-200",
        active 
          ? "bg-zinc-800 text-zinc-100 shadow-sm" 
          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export default App;
