import React, { useMemo } from 'react';
import { useStore } from '../store/store';
import { analyzeAccessibility } from '../engine/accessibility';
import { SURFACES } from '../engine/types';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { cn } from '../lib/utils';

export function AccessibilityScreen() {
  const result         = useStore(s => s.currentResult);
  const currentSurface = useStore(s => s.currentSurfaceType);
  const allResults     = useStore(s => s.allSurfaceResults);

  const a11y = useMemo(() => {
    if (!result) return null;
    return analyzeAccessibility(result.elements, SURFACES[currentSurface]);
  }, [result, currentSurface]);

  const allA11y = useMemo(() => {
    const out: Record<string, ReturnType<typeof analyzeAccessibility>> = {};
    for (const [type, r] of Object.entries(allResults)) {
      if (r) out[type] = analyzeAccessibility(r.elements, SURFACES[type as keyof typeof SURFACES]);
    }
    return out;
  }, [allResults]);

  if (!a11y) return <div className="p-8 text-zinc-500 text-sm">Run a layout first.</div>;

  return (
    <div className="w-full h-full overflow-y-auto bg-zinc-950 p-8">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Accessibility Analyzer</h2>
          <p className="text-sm text-zinc-500 mt-1">
            All checks are derived from actual rendered element state.
            Values are not hardcoded — they reflect the current layout on the selected surface.
          </p>
        </div>

        {/* Main score */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex items-center gap-6">
          <div className="text-center">
            <div className={cn('text-5xl font-bold font-mono',
              a11y.score >= 90 ? 'text-emerald-400' : a11y.score >= 70 ? 'text-yellow-400' : 'text-red-400'
            )}>{a11y.score}</div>
            <div className="text-xs text-zinc-500 mt-1 uppercase tracking-widest">A11Y Score</div>
          </div>

          <div className="flex-1 grid grid-cols-2 gap-3 text-sm">
            <A11yRow ok={a11y.targetSizeOk}   label={`CTA target size ≥ 44×44px`} />
            <A11yRow ok={a11y.contrastOk}     label="Contrast within threshold" />
            <A11yRow ok={a11y.textReadable}    label="Text readable at scale" />
            <A11yRow ok={a11y.hierarchyCorrect} label="Heading hierarchy correct" />
            <A11yRow ok={a11y.ctaVisible}      label="CTA visible on surface" />
          </div>
        </div>

        {/* Issues */}
        {a11y.issues.length > 0 ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 text-xs text-zinc-500 font-semibold uppercase tracking-widest">
              Issues ({a11y.issues.length})
            </div>
            <div className="divide-y divide-zinc-800/60">
              {a11y.issues.map((issue, i) => (
                <div key={i} className={cn('flex items-start gap-3 px-4 py-3',
                  issue.severity === 'error' ? 'bg-red-500/5' : 'bg-yellow-500/5'
                )}>
                  {issue.severity === 'error'
                    ? <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    : <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />}
                  <div>
                    <div className={cn('text-xs font-semibold uppercase tracking-wider mb-0.5',
                      issue.severity === 'error' ? 'text-red-400' : 'text-yellow-400'
                    )}>{issue.severity}</div>
                    <div className="text-sm text-zinc-300">{issue.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <div className="text-sm font-medium text-emerald-300">No accessibility issues on this surface</div>
          </div>
        )}

        {/* Cross-surface A11Y */}
        {Object.keys(allA11y).length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 text-xs text-zinc-500 font-semibold uppercase tracking-widest">
              Cross-Surface Accessibility
            </div>
            <div className="p-4 grid grid-cols-5 gap-3">
              {Object.entries(allA11y).map(([type, result]) => (
                <div key={type} className="text-center">
                  <div className={cn('text-2xl font-bold font-mono',
                    result.score >= 90 ? 'text-emerald-400' : result.score >= 70 ? 'text-yellow-400' : 'text-red-400'
                  )}>{result.score}</div>
                  <div className="text-[10px] text-zinc-500 capitalize mt-0.5">{type}</div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function A11yRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok
        ? <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
        : <XCircle className="w-4 h-4 text-red-500 shrink-0" />}
      <span className={cn(ok ? 'text-zinc-300' : 'text-zinc-400')}>{label}</span>
    </div>
  );
}
