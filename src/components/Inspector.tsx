import React, { useState } from 'react';
import { useStore } from '../store/store';
import { CheckCircle2, XCircle, AlertTriangle, Info, Eye, EyeOff, Lock, Unlock, ChevronDown } from 'lucide-react';
import { cn } from '../lib/utils';

export function Inspector() {
  const result        = useStore(s => s.currentResult);
  const selectedId    = useStore(s => s.selectedElementId);
  const selectElement = useStore(s => s.selectElement);
  const updateElement = useStore(s => s.updateElement);
  const showConstraints = useStore(s => s.showConstraints);
  const showSafeZone    = useStore(s => s.showSafeZone);
  const showFocalPoint  = useStore(s => s.showFocalPoint);
  const showBoundingBoxes = useStore(s => s.showBoundingBoxes);
  const showInteractionZones = useStore(s => s.showInteractionZones);
  const toggleConstraints = useStore(s => s.toggleConstraints);
  const toggleSafeZone    = useStore(s => s.toggleSafeZone);
  const toggleFocalPoint  = useStore(s => s.toggleFocalPoint);
  const toggleBoundingBoxes = useStore(s => s.toggleBoundingBoxes);
  const toggleInteractionZones = useStore(s => s.toggleInteractionZones);

  if (!result) return <div className="p-4 text-zinc-500 text-xs">No layout result.</div>;

  const { score, metrics, warnings, collisions, decisions } = result;
  const selectedElement = selectedId ? result.elements.find(e => e.id === selectedId) : null;
  const elementDecisions = selectedId ? decisions.filter(d => d.elementId === selectedId) : [];

  return (
    <div className="flex flex-col divide-y divide-zinc-800/60">

      {/* Global health */}
      {!selectedElement && (
        <>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Layout Health</span>
              <span className={cn('text-xl font-bold font-mono', score >= 90 ? 'text-emerald-400' : score >= 70 ? 'text-yellow-400' : 'text-red-400')}>
                {score}<span className="text-zinc-600 text-sm"> /100</span>
              </span>
            </div>

            {/* Metrics */}
            <div className="space-y-1.5">
              <Metric ok={collisions.length === 0}    label="No collisions" />
              <Metric ok={metrics.ctaVisible}          label="CTA visible" />
              <Metric ok={metrics.productFocalPointPreserved} label="Focal point preserved" />
              <Metric ok={metrics.safeZoneCompliant}   label="Safe zone compliant" />
              <Metric ok={metrics.textReadabilityOk}   label="Text readability" />
              <Metric ok={metrics.interactiveTargetSizeOk} label="Interaction target size" />
            </div>

            {/* Dimension bars */}
            <div className="space-y-2 pt-1">
              <DiagBar label="Hierarchy"  value={metrics.hierarchyScore} />
              <DiagBar label="Whitespace" value={metrics.whitespaceScore} />
              <DiagBar label="Overflow"   value={100 - Math.min(100, metrics.overflowCount * 25)} invert />
            </div>
          </div>

          {/* Warnings */}
          {warnings.length > 0 && (
            <div className="p-4 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[10px] text-yellow-500/80 font-semibold uppercase tracking-widest mb-2">
                <AlertTriangle className="w-3 h-3" /> Warnings ({warnings.length})
              </div>
              {warnings.map((w, i) => (
                <div key={i} className="flex gap-2 text-[11px] text-yellow-200/60 bg-yellow-500/8 px-2.5 py-1.5 rounded">
                  <Info className="w-3 h-3 shrink-0 mt-0.5 text-yellow-400" />
                  <span>{w.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Visibility toggles */}
          <div className="p-4 space-y-1.5">
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-2">Overlays</div>
            <ToggleRow label="Safe Zone"        on={showSafeZone}         toggle={toggleSafeZone} />
            <ToggleRow label="Constraints"      on={showConstraints}      toggle={toggleConstraints} />
            <ToggleRow label="Focal Point"      on={showFocalPoint}       toggle={toggleFocalPoint} />
            <ToggleRow label="Bounding Boxes"   on={showBoundingBoxes}    toggle={toggleBoundingBoxes} />
            <ToggleRow label="Interaction Zones" on={showInteractionZones} toggle={toggleInteractionZones} />
          </div>
        </>
      )}

      {/* Selected element */}
      {selectedElement && (
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] text-zinc-500 uppercase tracking-widest">Element</span>
              <div className="text-base font-bold text-zinc-100 capitalize">{selectedElement.label}</div>
            </div>
            <div className="flex items-center gap-2">
              {selectedElement.hidden && <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-wider">HIDDEN</span>}
              {selectedElement.locked && <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 uppercase tracking-wider">LOCKED</span>}
            </div>
          </div>

          {/* Properties grid */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <PropBox label="Position" value={`${Math.round(selectedElement.x)}, ${Math.round(selectedElement.y)}`} />
            <PropBox label="Size"     value={`${Math.round(selectedElement.width)} × ${Math.round(selectedElement.height)}`} />
            <PropBox label="Visual Priority"      value={`${selectedElement.visualPriority}`} />
            <PropBox label="Interaction Priority" value={`${selectedElement.interactionPriority}`} />
            <PropBox label="Min Size" value={`${selectedElement.minWidth} × ${selectedElement.minHeight}`} />
            <PropBox label="Type"     value={selectedElement.type} />
          </div>

          {/* Behaviors */}
          <div>
            <div className="text-[10px] text-zinc-500 uppercase tracking-widest mb-1.5">Surface Behaviors</div>
            {selectedElement.responsiveBehavior ? (
              <div className="space-y-1">
                {(Object.entries(selectedElement.responsiveBehavior) as [string, string][]).map(([surf, beh]) => (
                  <div key={surf} className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-500 capitalize">{surf}</span>
                    <span className={cn('font-mono px-1.5 py-0.5 rounded text-[10px]',
                      beh === 'hide' ? 'text-red-400 bg-red-500/10' :
                      beh === 'preserve' ? 'text-emerald-400 bg-emerald-500/10' :
                      'text-indigo-400 bg-indigo-500/10'
                    )}>{beh}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-wrap gap-1">
                {selectedElement.behavior.map(b => (
                  <span key={b} className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">{b}</span>
                ))}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div className="flex gap-2">
            <button
              onClick={() => updateElement(selectedElement.id, { hidden: !selectedElement.hidden })}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[11px] font-medium transition-colors"
            >
              {selectedElement.hidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              {selectedElement.hidden ? 'Show' : 'Hide'}
            </button>
            <button
              onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-[11px] font-medium transition-colors',
                selectedElement.locked ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30' : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
              )}
            >
              {selectedElement.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              {selectedElement.locked ? 'Locked' : 'Lock'}
            </button>
          </div>

          {/* Decision trace */}
          <div>
            <div className="text-[10px] text-indigo-400 uppercase tracking-widest font-semibold mb-2">Decision Trace</div>
            {elementDecisions.length === 0 ? (
              <p className="text-[11px] text-zinc-600 italic">No transformations applied for this surface.</p>
            ) : (
              <div className="relative ml-2 pl-3 border-l border-zinc-800 space-y-3">
                {elementDecisions.map((d, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-zinc-900 border border-indigo-500" />
                    <div className="text-[9px] font-mono text-zinc-600 mb-0.5">
                      {String(d.sequence).padStart(2, '0')} — {d.reason}
                    </div>
                    <div className="text-[11px] text-zinc-200 font-medium">{d.action}</div>
                    {d.confidence !== undefined && (
                      <div className="text-[9px] text-zinc-600 mt-0.5 flex items-center gap-2">
                        Constraint confidence: {(d.confidence * 100).toFixed(0)}%
                        {d.deltaX !== undefined && Math.abs(d.deltaX) > 0.5 && <span className="text-zinc-500">ΔX {d.deltaX > 0 ? '+' : ''}{Math.round(d.deltaX)}px</span>}
                        {d.deltaY !== undefined && Math.abs(d.deltaY) > 0.5 && <span className="text-zinc-500">ΔY {d.deltaY > 0 ? '+' : ''}{Math.round(d.deltaY)}px</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={() => selectElement(null)}
            className="w-full py-1.5 rounded text-[11px] text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Clear Selection
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Metric({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[12px]">
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
           : <XCircle      className="w-3.5 h-3.5 text-red-500 shrink-0" />}
      <span className={cn('text-zinc-400', ok && 'text-zinc-300')}>{label}</span>
    </div>
  );
}

function DiagBar({ label, value, invert = false }: { label: string; value: number; invert?: boolean }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <span className="text-zinc-500 w-20 shrink-0">{label}</span>
      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-500', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-zinc-500 w-8 text-right">{Math.round(pct)}</span>
    </div>
  );
}

function PropBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded p-2">
      <div className="text-[9px] text-zinc-600 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="font-mono text-zinc-300 text-[11px] truncate">{value}</div>
    </div>
  );
}

function ToggleRow({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} className="w-full flex items-center justify-between py-1 text-[12px] text-zinc-400 hover:text-zinc-200 transition-colors">
      <span>{label}</span>
      <div className={cn('w-8 h-4 rounded-full transition-colors relative', on ? 'bg-indigo-500' : 'bg-zinc-700')}>
        <div className={cn('absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all', on ? 'left-4' : 'left-0.5')} />
      </div>
    </button>
  );
}
