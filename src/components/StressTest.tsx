import React, { useState } from 'react';
import { useStore } from '../store/store';
import { calculateLayout, Surface } from '../engine';
import { Play, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const TEST_SURFACES: Surface[] = [
  { type: 'mobile', width: 320, height: 568, label: 'iPhone SE' },
  { type: 'mobile', width: 375, height: 812, label: 'iPhone X' },
  { type: 'mobile', width: 390, height: 844, label: 'iPhone 13' },
  { type: 'tablet', width: 768, height: 1024, label: 'iPad Mini' },
  { type: 'tablet', width: 1024, height: 768, label: 'iPad Landscape' },
  { type: 'desktop', width: 1280, height: 720, label: 'HD 720p' },
  { type: 'desktop', width: 1440, height: 900, label: 'MacBook' },
  { type: 'desktop', width: 1920, height: 1080, label: 'FHD 1080p' },
];

export function StressTest() {
  const baseElements = useStore(state => state.baseElements);
  const weights = useStore(state => state.weights);
  
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const runTest = async () => {
    setIsRunning(true);
    setResults([]);
    
    for (let i = 0; i < TEST_SURFACES.length; i++) {
      // Small delay to animate progress visually
      await new Promise(r => setTimeout(r, 200));
      
      const surface = TEST_SURFACES[i];
      const result = calculateLayout(baseElements, surface, weights);
      
      setResults(prev => [...prev, {
        surface,
        score: result.score,
        collisions: result.collisions.length,
        warnings: result.warnings.length,
        time: result.calculationTimeMs,
        passed: result.score >= 70 && result.collisions.length === 0,
      }]);
    }
    
    setIsRunning(false);
  };

  const passedCount = results.filter(r => r.passed).length;
  const isComplete = results.length === TEST_SURFACES.length;

  return (
    <div className="w-full h-full bg-zinc-950 p-8 overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Layout Stress Test</h2>
            <p className="text-zinc-400 text-sm">Automated evaluation across heterogeneous viewport constraints.</p>
          </div>
          <button 
            onClick={runTest}
            disabled={isRunning}
            className={cn(
              "px-6 py-2 rounded-md text-sm font-bold flex items-center gap-2 shadow-lg transition-all",
              isRunning 
                ? "bg-zinc-800 text-zinc-500 cursor-not-allowed" 
                : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-indigo-500/20"
            )}
          >
            {isRunning ? (
              <div className="w-4 h-4 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            {isRunning ? 'RUNNING...' : 'RUN STRESS TEST'}
          </button>
        </div>

        {isComplete && (
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Surfaces Passed" value={`${passedCount} / ${TEST_SURFACES.length}`} highlight={passedCount === TEST_SURFACES.length} />
            <StatCard label="Avg Score" value={Math.round(results.reduce((a, b) => a + b.score, 0) / results.length)} highlight />
            <StatCard label="Total Collisions" value={results.reduce((a, b) => a + b.collisions, 0)} alert={results.reduce((a, b) => a + b.collisions, 0) > 0} />
            <StatCard label="Avg Engine Time" value={`${(results.reduce((a, b) => a + b.time, 0) / results.length).toFixed(2)}ms`} />
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-900/80 border-b border-zinc-800 text-zinc-400">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Surface</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Score</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Collisions</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Warnings</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Engine Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {TEST_SURFACES.map((surface, i) => {
                const res = results[i];
                return (
                  <tr key={i} className={cn("transition-colors", res ? "bg-transparent" : "opacity-40")}>
                    <td className="px-6 py-3">
                      <div className="font-medium text-zinc-200">{surface.label}</div>
                      <div className="text-xs text-zinc-500">{surface.width} × {surface.height}</div>
                    </td>
                    <td className="px-6 py-3">
                      {res ? (
                        res.passed ? (
                          <div className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded text-xs font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Passed
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-1 rounded text-xs font-medium">
                            <XCircle className="w-3.5 h-3.5" /> Failed
                          </div>
                        )
                      ) : (
                        <div className="text-zinc-600 text-xs">-</div>
                      )}
                    </td>
                    <td className="px-6 py-3">
                      {res ? <span className={cn("font-mono font-bold", res.score >= 90 ? "text-emerald-400" : res.score >= 70 ? "text-yellow-400" : "text-red-400")}>{res.score}</span> : '-'}
                    </td>
                    <td className="px-6 py-3">
                      {res ? (
                        <span className={cn("font-mono", res.collisions > 0 ? "text-red-400" : "text-zinc-500")}>{res.collisions}</span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-3">
                      {res ? (
                        <span className={cn("font-mono flex items-center gap-1", res.warnings > 0 ? "text-yellow-400" : "text-zinc-500")}>
                          {res.warnings > 0 && <AlertTriangle className="w-3 h-3" />}
                          {res.warnings}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-3">
                      {res ? (
                        <span className="font-mono text-zinc-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {res.time.toFixed(2)}ms
                        </span>
                      ) : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, highlight, alert }: { label: string, value: number | string, highlight?: boolean, alert?: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
      <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2">{label}</div>
      <div className={cn(
        "text-3xl font-bold font-mono",
        alert ? "text-red-400" : highlight ? "text-white" : "text-zinc-300"
      )}>{value}</div>
    </div>
  );
}
