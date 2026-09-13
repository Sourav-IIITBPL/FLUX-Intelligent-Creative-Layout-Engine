import React, { useState } from 'react';
import { useStore } from '../store/store';
import { calculateLayout } from '../engine/layoutEngine';
import { Surface, SurfaceType } from '../engine/types';
import { Play, CheckCircle2, XCircle, AlertTriangle, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

const TEST_SURFACES: (Surface & { deviceLabel: string })[] = [
  { type: 'mobile',  width: 320,  height: 568,  label: 'Mobile', aspectRatio: '9:16', deviceLabel: 'iPhone SE' },
  { type: 'mobile',  width: 375,  height: 812,  label: 'Mobile', aspectRatio: '9:16', deviceLabel: 'iPhone X' },
  { type: 'mobile',  width: 390,  height: 844,  label: 'Mobile', aspectRatio: '9:16', deviceLabel: 'iPhone 14' },
  { type: 'tablet',  width: 768,  height: 1024, label: 'Tablet', aspectRatio: '4:3',  deviceLabel: 'iPad Mini' },
  { type: 'tablet',  width: 1024, height: 768,  label: 'Tablet', aspectRatio: '4:3',  deviceLabel: 'iPad Landscape' },
  { type: 'desktop', width: 1280, height: 720,  label: 'Desktop', aspectRatio: '16:9', deviceLabel: 'HD 720p' },
  { type: 'desktop', width: 1440, height: 900,  label: 'Desktop', aspectRatio: '16:9', deviceLabel: 'MacBook 14"' },
  { type: 'desktop', width: 1920, height: 1080, label: 'Desktop', aspectRatio: '16:9', deviceLabel: 'FHD 1080p' },
];

interface TestRow {
  surface: typeof TEST_SURFACES[0];
  score: number;
  collisions: number;
  warnings: number;
  time: number;
  passed: boolean;
}

export function StressTest() {
  const baseElements = useStore(s => s.baseElements);
  const weights      = useStore(s => s.weights);

  const [running, setRunning]   = useState(false);
  const [results, setResults]   = useState<TestRow[]>([]);

  const run = async () => {
    setRunning(true);
    setResults([]);

    for (const surface of TEST_SURFACES) {
      await new Promise(r => setTimeout(r, 160));
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

    setRunning(false);
  };

  const done = results.length === TEST_SURFACES.length;
  const passed = results.filter(r => r.passed).length;

  return (
    <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-100">Layout Stress Test</h2>
            <p className="text-sm text-zinc-500 mt-1">
              Automated constraint evaluation across {TEST_SURFACES.length} device viewports.
              All results are computed from actual engine passes — no mock data.
            </p>
          </div>
          <button
            onClick={run}
            disabled={running}
            className={cn(
              'flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-bold shadow-lg transition-all',
              running ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20'
            )}
          >
            {running ? <div className="w-4 h-4 border-2 border-zinc-600 border-t-indigo-400 rounded-full animate-spin" /> : <Play className="w-4 h-4" />}
            {running ? `Testing ${results.length + 1} / ${TEST_SURFACES.length}…` : 'RUN STRESS TEST'}
          </button>
        </div>

        {/* Summary */}
        {done && (
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Passed" value={`${passed} / ${TEST_SURFACES.length}`} ok={passed === TEST_SURFACES.length} />
            <StatCard label="Average Score" value={Math.round(results.reduce((a, r) => a + r.score, 0) / results.length)} />
            <StatCard label="Total Collisions" value={results.reduce((a, r) => a + r.collisions, 0)} bad={results.some(r => r.collisions > 0)} />
            <StatCard label="Avg Engine Time" value={`${(results.reduce((a, r) => a + r.time, 0) / results.length).toFixed(2)}ms`} />
          </div>
        )}

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 text-[10px] text-zinc-500 uppercase tracking-widest">
                <th className="px-5 py-3 text-left font-semibold">Surface</th>
                <th className="px-5 py-3 text-left font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Score</th>
                <th className="px-5 py-3 text-right font-semibold">Collisions</th>
                <th className="px-5 py-3 text-right font-semibold">Warnings</th>
                <th className="px-5 py-3 text-right font-semibold">Engine Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50">
              {TEST_SURFACES.map((surface, i) => {
                const r = results[i];
                const isActive = running && i === results.length;
                return (
                  <tr key={i} className={cn('transition-all', isActive && 'bg-indigo-500/5', !r && !isActive && 'opacity-30')}>
                    <td className="px-5 py-3">
                      <div className="font-medium text-zinc-200 text-[13px]">{surface.deviceLabel}</div>
                      <div className="text-[10px] font-mono text-zinc-600">{surface.width}×{surface.height} · {surface.type}</div>
                    </td>
                    <td className="px-5 py-3">
                      {r ? (
                        r.passed
                          ? <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded text-[11px] font-medium"><CheckCircle2 className="w-3 h-3" />Passed</span>
                          : <span className="inline-flex items-center gap-1.5 text-red-400 bg-red-400/10 px-2 py-0.5 rounded text-[11px] font-medium"><XCircle className="w-3 h-3" />Failed</span>
                      ) : isActive ? <span className="text-indigo-400 text-[11px] animate-pulse">Testing…</span> : <span className="text-zinc-700 text-[11px]">Pending</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn('font-mono font-bold', !r ? 'text-zinc-700' : r.score >= 90 ? 'text-emerald-400' : r.score >= 70 ? 'text-yellow-400' : 'text-red-400')}>
                        {r ? r.score : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn('font-mono', !r ? 'text-zinc-700' : r.collisions > 0 ? 'text-red-400' : 'text-zinc-500')}>
                        {r ? r.collisions : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn('font-mono', !r ? 'text-zinc-700' : r.warnings > 0 ? 'text-yellow-400' : 'text-zinc-500')}>
                        {r ? r.warnings : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <span className={cn('font-mono text-[11px]', !r ? 'text-zinc-700' : 'text-zinc-400')}>
                        {r ? `${r.time.toFixed(2)}ms` : '—'}
                      </span>
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

function StatCard({ label, value, ok, bad }: { label: string; value: string | number; ok?: boolean; bad?: boolean }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
      <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2">{label}</div>
      <div className={cn('text-3xl font-bold font-mono', bad ? 'text-red-400' : ok ? 'text-emerald-400' : 'text-zinc-100')}>{value}</div>
    </div>
  );
}
