import React, { useState } from 'react';
import { useStore } from '../store/store';
import { runBreakpointExplorer } from '../engine/breakpointExplorer';
import { CheckCircle2, AlertTriangle, XCircle, Zap, Download } from 'lucide-react';
import { cn } from '../lib/utils';

export function RDTools() {
  const baseElements  = useStore(s => s.baseElements);
  const weights       = useStore(s => s.weights);
  const events        = useStore(s => s.events);
  const result        = useStore(s => s.currentResult);
  const chaosActive   = useStore(s => s.chaosActive);
  const injectChaos   = useStore(s => s.injectChaos);
  const clearChaos    = useStore(s => s.clearChaos);
  const exportJSON    = useStore(s => s.exportJSON);

  const [bpResults, setBpResults] = useState<ReturnType<typeof runBreakpointExplorer> | null>(null);
  const [bpRunning, setBpRunning] = useState(false);

  const runBp = async () => {
    setBpRunning(true);
    await new Promise(r => setTimeout(r, 100));
    setBpResults(runBreakpointExplorer(baseElements, weights));
    setBpRunning(false);
  };

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.download = 'flux-layout-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const profiler = result?.profiler;

  return (
    <div className="w-full h-full flex overflow-hidden">
      {/* Left column */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">

        {/* Breakpoint Explorer */}
        <Panel title="Breakpoint Explorer" subtitle="What breaks first as viewport shrinks?">
          <div className="px-4 pb-4 space-y-4">
            <button
              onClick={runBp}
              disabled={bpRunning}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold transition-all',
                bpRunning ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white'
              )}
            >
              {bpRunning ? <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-white rounded-full animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              {bpRunning ? 'Analysing…' : 'RUN BREAKPOINT ANALYSIS'}
            </button>

            {bpResults && (
              <div className="space-y-2">
                {bpResults.map((bp, i) => (
                  <div key={i} className="border border-zinc-800 rounded-lg overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900">
                      <span className="font-mono font-bold text-zinc-300 text-sm">{bp.width}px</span>
                      <div className="flex items-center gap-3">
                        {bp.failures.length === 0
                          ? <span className="text-[11px] text-emerald-400 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> All constraints preserved</span>
                          : <span className="text-[11px] text-yellow-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> {bp.failures.length} issue{bp.failures.length > 1 ? 's' : ''}</span>}
                        <span className={cn('font-mono font-bold text-sm', bp.score >= 90 ? 'text-emerald-400' : bp.score >= 70 ? 'text-yellow-400' : 'text-red-400')}>{bp.score}</span>
                      </div>
                    </div>
                    {bp.failures.length > 0 && (
                      <div className="px-4 py-2 space-y-1.5 bg-zinc-900/50">
                        {bp.failures.map((f, j) => (
                          <div key={j} className="flex items-start gap-2 text-[11px]">
                            {f.severity === 'error'
                              ? <XCircle className="w-3 h-3 text-red-500 shrink-0 mt-0.5" />
                              : <AlertTriangle className="w-3 h-3 text-yellow-500 shrink-0 mt-0.5" />}
                            <span className="text-zinc-400">{f.issue}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Panel>

        {/* Chaos Test */}
        <Panel title="Chaos Test" subtitle="Inject broken constraints. Watch the engine recover.">
          <div className="px-4 pb-4 space-y-4">
            <p className="text-xs text-zinc-500">
              Injects: oversized CTA (600px), overflowing headline (2000px), locked out-of-bounds badge.
              The engine attempts constraint-based recovery.
            </p>

            <div className="flex gap-3">
              <button
                onClick={injectChaos}
                disabled={chaosActive}
                className={cn(
                  'px-5 py-2 rounded-lg text-sm font-bold transition-all',
                  chaosActive ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-red-500/80 hover:bg-red-500 text-white'
                )}
              >
                {chaosActive ? 'CHAOS ACTIVE' : 'INJECT CHAOS'}
              </button>
              {chaosActive && (
                <button onClick={clearChaos} className="px-5 py-2 rounded-lg text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-all">
                  RECOVER
                </button>
              )}
            </div>

            {chaosActive && result && (
              <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4 space-y-2">
                <div className="text-xs font-semibold text-red-400 uppercase tracking-wider">Chaos Active — Engine Response</div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-zinc-400">Score:</span>
                  <span className={cn('font-mono font-bold', result.score >= 70 ? 'text-yellow-400' : 'text-red-400')}>{result.score}</span>
                  <span className="text-zinc-400">Collisions:</span>
                  <span className={cn('font-mono font-bold', result.collisions.length > 0 ? 'text-red-400' : 'text-emerald-400')}>{result.collisions.length}</span>
                </div>
                {result.decisions.length > 0 && (
                  <div className="text-xs text-zinc-500 mt-1">
                    Engine issued {result.decisions.length} constraint decisions during recovery.
                  </div>
                )}
              </div>
            )}
          </div>
        </Panel>

        {/* Performance Profiler */}
        {profiler && (
          <Panel title="Engine Profiler">
            <div className="px-4 pb-4 grid grid-cols-2 gap-2">
              {[
                ['Layout calc',    `${profiler.layoutCalcMs.toFixed(3)}ms`],
                ['Collision pass', `${profiler.collisionPassMs.toFixed(3)}ms`],
                ['Scoring',        `${profiler.scoringMs.toFixed(3)}ms`],
                ['Candidate gen',  `${profiler.candidateGenMs.toFixed(3)}ms`],
                ['Candidates',     String(profiler.candidateCount)],
                ['Elements',       String(profiler.elementCount)],
              ].map(([l, v]) => (
                <div key={l} className="bg-zinc-900 border border-zinc-800 rounded p-2.5">
                  <div className="text-[9px] text-zinc-600 uppercase tracking-wider">{l}</div>
                  <div className="font-mono text-zinc-200 text-sm mt-0.5">{v}</div>
                </div>
              ))}
              <div className="col-span-2 bg-zinc-800/80 border border-zinc-700 rounded p-2.5 flex items-center justify-between">
                <span className="text-xs text-zinc-400 font-semibold">Total engine time</span>
                <span className="font-mono font-bold text-zinc-100">{profiler.totalMs.toFixed(3)}ms</span>
              </div>
            </div>
          </Panel>
        )}

        {/* Export */}
        <Panel title="Export">
          <div className="px-4 pb-4">
            <button onClick={handleExport} className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors">
              <Download className="w-4 h-4" /> Export Layout JSON
            </button>
          </div>
        </Panel>
      </div>

      {/* Right — Event Log */}
      <div className="w-80 shrink-0 border-l border-zinc-800 flex flex-col bg-zinc-950">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Engine Event Log</span>
          <span className="text-[10px] font-mono text-zinc-600">{events.length} events</span>
        </div>
        <div className="flex-1 overflow-y-auto py-1 font-mono">
          {events.length === 0 && <div className="px-4 py-3 text-xs text-zinc-600">Waiting for events…</div>}
          {events.map((e, i) => (
            <div key={i} className="px-4 py-1.5 border-b border-zinc-800/40 hover:bg-zinc-900/40 transition-colors">
              <div className="text-[9px] text-zinc-600">{new Date(e.timestamp).toLocaleTimeString()}</div>
              <div className="text-[10px] text-indigo-400 font-semibold leading-tight">{e.type}</div>
              <div className="text-[10px] text-zinc-500 leading-tight truncate">{e.data}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Panel({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="text-sm font-semibold text-zinc-200">{title}</div>
        {subtitle && <div className="text-xs text-zinc-500 mt-0.5">{subtitle}</div>}
      </div>
      {children}
    </div>
  );
}
