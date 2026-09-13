import React, { useState } from 'react';
import { useStore } from '../store/store';
import { DEFAULT_WEIGHTS, EngineWeights } from '../engine/types';
import { RefreshCw, Zap, ChevronDown, ChevronRight, Camera } from 'lucide-react';
import { cn } from '../lib/utils';

export function EngineLab() {
  const weights       = useStore(s => s.weights);
  const setWeights    = useStore(s => s.setWeights);
  const recalculate   = useStore(s => s.recalculate);
  const recalculateAll = useStore(s => s.recalculateAll);
  const result        = useStore(s => s.currentResult);
  const saveSnapshot  = useStore(s => s.saveSnapshot);
  const snapshots     = useStore(s => s.snapshots);
  const loadSnapshot  = useStore(s => s.loadSnapshot);
  const deleteSnapshot = useStore(s => s.deleteSnapshot);

  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [prevScore, setPrevScore] = useState<number | null>(null);

  const handleRecalc = () => {
    if (result) setPrevScore(result.score);
    recalculate();
    recalculateAll();
  };

  const handleWeightChange = (key: keyof EngineWeights, v: number) => {
    setWeights({ [key]: v });
  };

  const candidates = result?.candidates ?? [];
  const profiler   = result?.profiler;

  return (
    <div className="w-full h-full overflow-y-auto bg-zinc-950">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                <Zap className="w-3 h-3" /> Deterministic
              </div>
            </div>
            <h2 className="text-xl font-bold text-zinc-100 tracking-tight">Engine Lab</h2>
            <p className="text-zinc-500 text-sm mt-0.5">
              Tune constraint weights. The engine generates 8 candidate layouts and selects the highest-scoring valid arrangement.
            </p>
          </div>
        </div>

        {/* Weights */}
        <Section title="Constraint Weights">
          <div className="space-y-5 p-4">
            <WeightSlider label="Collision Penalty"        k="collisionPenalty"   weights={weights} onChange={handleWeightChange} />
            <WeightSlider label="Safe Zone"                k="safeZone"           weights={weights} onChange={handleWeightChange} />
            <WeightSlider label="Focal Point Preservation" k="focalPoint"         weights={weights} onChange={handleWeightChange} />
            <WeightSlider label="CTA Preservation"         k="ctaPreservation"    weights={weights} onChange={handleWeightChange} />
            <WeightSlider label="Hierarchy"                k="hierarchy"          weights={weights} onChange={handleWeightChange} />
            <WeightSlider label="Whitespace Balance"       k="whitespace"         weights={weights} onChange={handleWeightChange} />
            <WeightSlider label="Interaction Safety"       k="interaction"        weights={weights} onChange={handleWeightChange} />
          </div>

          <div className="px-4 pb-4 flex gap-3">
            <button
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
              className="px-4 py-1.5 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
            >
              Reset defaults
            </button>
            <button
              onClick={handleRecalc}
              className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 transition-all"
            >
              <RefreshCw className="w-4 h-4" /> RECALCULATE LAYOUT
            </button>
          </div>

          {/* Score diff */}
          {prevScore !== null && result && (
            <div className="px-4 pb-4">
              <div className="flex items-center gap-3 text-sm bg-zinc-900 border border-zinc-800 rounded-lg p-3">
                <span className="text-zinc-500">Previous:</span>
                <span className="font-mono">{prevScore}</span>
                <span className="text-zinc-600">→</span>
                <span className={cn('font-mono font-bold', result.score > prevScore ? 'text-emerald-400' : result.score < prevScore ? 'text-red-400' : 'text-zinc-400')}>
                  {result.score}
                </span>
                {result.score !== prevScore && (
                  <span className={cn('text-xs', result.score > prevScore ? 'text-emerald-500' : 'text-red-500')}>
                    {result.score > prevScore ? '+' : ''}{result.score - prevScore} pts
                  </span>
                )}
              </div>
            </div>
          )}
        </Section>

        {/* Candidate search */}
        <Section title={`Candidate Search — ${candidates.length} evaluated`}>
          <div className="p-4 space-y-2">
            {candidates.map(c => (
              <div key={c.id} className={cn(
                'flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-colors',
                c.id === result?.selectedCandidateId
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-200'
                  : 'border-zinc-800 text-zinc-400'
              )}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px] text-zinc-600">#{c.id}</span>
                  <span className="text-[12px]">{c.description}</span>
                  {c.id === result?.selectedCandidateId && (
                    <span className="text-[9px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">SELECTED</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {c.collisions.length > 0 && <span className="text-[10px] text-red-400">{c.collisions.length} coll</span>}
                  <span className={cn('font-mono font-bold text-sm', c.score >= 90 ? 'text-emerald-400' : c.score >= 70 ? 'text-yellow-400' : 'text-red-400')}>
                    {c.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Profiler */}
        {profiler && (
          <Section title="Engine Profiler">
            <div className="p-4 grid grid-cols-2 gap-2">
              <ProfilerRow label="Layout calc"    value={`${profiler.layoutCalcMs.toFixed(2)}ms`} />
              <ProfilerRow label="Collision pass" value={`${profiler.collisionPassMs.toFixed(2)}ms`} />
              <ProfilerRow label="Scoring"        value={`${profiler.scoringMs.toFixed(2)}ms`} />
              <ProfilerRow label="Candidate gen"  value={`${profiler.candidateGenMs.toFixed(2)}ms`} />
              <ProfilerRow label="Candidates"     value={String(profiler.candidateCount)} />
              <ProfilerRow label="Elements"       value={String(profiler.elementCount)} />
              <div className="col-span-2 flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-800/50 border border-zinc-700">
                <span className="text-xs text-zinc-400 font-semibold">Total engine time</span>
                <span className="font-mono font-bold text-zinc-100">{profiler.totalMs.toFixed(2)}ms</span>
              </div>
            </div>
          </Section>
        )}

        {/* Snapshots */}
        <Section title="Version Snapshots">
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <input
                value={snapshotLabel}
                onChange={e => setSnapshotLabel(e.target.value)}
                placeholder="Snapshot label…"
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-200 placeholder-zinc-600 outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => { if (snapshotLabel.trim()) { saveSnapshot(snapshotLabel.trim()); setSnapshotLabel(''); } }}
                className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium rounded transition-colors flex items-center gap-1.5"
              >
                <Camera className="w-3.5 h-3.5" /> Save
              </button>
            </div>

            {snapshots.length === 0 ? (
              <div className="text-xs text-zinc-600 italic py-2">No snapshots saved.</div>
            ) : (
              <div className="space-y-1.5">
                {snapshots.map(s => (
                  <div key={s.id} className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded px-3 py-2">
                    <span className="flex-1 text-xs text-zinc-300">{s.label}</span>
                    <span className="text-[10px] text-zinc-600 font-mono">{s.surfaceType}</span>
                    <button onClick={() => loadSnapshot(s.id)} className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors">Load</button>
                    <button onClick={() => deleteSnapshot(s.id)} className="text-[10px] text-zinc-600 hover:text-red-400 transition-colors">×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Note */}
        <div className="text-xs text-zinc-600 bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 leading-relaxed">
          <strong className="text-zinc-400">Architecture note:</strong> The current scoring layer is deterministic and weight-based.
          Future integration: an ML policy could dynamically adjust these weights based on conversion signals,
          while the constraint engine remains the validator.
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left text-sm font-semibold text-zinc-300 hover:bg-zinc-800/40 transition-colors"
      >
        {open ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
        {title}
      </button>
      {open && <div className="border-t border-zinc-800">{children}</div>}
    </div>
  );
}

function WeightSlider({ label, k, weights, onChange }: {
  label: string;
  k: keyof EngineWeights;
  weights: EngineWeights;
  onChange: (k: keyof EngineWeights, v: number) => void;
}) {
  const v = weights[k];
  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-zinc-400 w-48 shrink-0">{label}</span>
      <input
        type="range" min={0} max={5} step={0.1} value={v}
        onChange={e => onChange(k, parseFloat(e.target.value))}
        className="flex-1"
      />
      <span className="font-mono text-xs text-zinc-400 w-8 text-right">{v.toFixed(1)}</span>
    </div>
  );
}

function ProfilerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-800">
      <span className="text-[11px] text-zinc-500">{label}</span>
      <span className="font-mono text-[11px] text-zinc-300">{value}</span>
    </div>
  );
}
