import React from 'react';
import { useStore } from '../store/store';
import { LayoutDecision } from '../engine';
import { cn } from '../lib/utils';
import { CheckCircle2, XCircle, AlertTriangle, Info, ShieldAlert, FileWarning, EyeOff } from 'lucide-react';

export function Inspector() {
  const result = useStore(state => state.currentResult);
  const selectedId = useStore(state => state.selectedElementId);
  const showConstraints = useStore(state => state.showConstraints);
  const toggleConstraints = useStore(state => state.toggleConstraints);
  const updateElement = useStore(state => state.updateElement);

  if (!result) return <div className="p-4 text-zinc-500 text-sm">No layout generated.</div>;

  const { score, metrics, warnings, collisions, decisions } = result;

  const selectedElement = selectedId ? result.elements.find(e => e.id === selectedId) : null;
  const elementDecisions = selectedId ? decisions.filter(d => d.elementId === selectedId) : [];

  return (
    <div className="flex flex-col h-full divide-y divide-zinc-800">
      
      {/* Global Health */}
      {!selectedId && (
        <>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-zinc-300">LAYOUT HEALTH</h3>
              <div className={cn(
                "text-2xl font-bold font-mono",
                score >= 90 ? "text-emerald-400" : score >= 70 ? "text-yellow-400" : "text-red-400"
              )}>
                {score} <span className="text-zinc-600 text-sm">/ 100</span>
              </div>
            </div>

            <div className="space-y-2.5 text-sm">
              <MetricRow pass={collisions.length === 0} label="No collisions" />
              <MetricRow pass={metrics.ctaVisible} label="CTA visible" />
              <MetricRow pass={metrics.productFocalPointPreserved} label="Focal point preserved" />
              <MetricRow pass={metrics.safeZoneCompliant} label="Safe zone compliant" />
              <MetricRow pass={metrics.textReadabilityOk} label="Text readability" />
              <MetricRow pass={metrics.interactiveTargetSizeOk} label="Interactive target size" />
            </div>
          </div>

          {/* Warnings Panel */}
          {warnings.length > 0 && (
            <div className="p-5 bg-yellow-500/5">
              <h3 className="text-xs font-semibold text-yellow-500/80 mb-3 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Warnings
              </h3>
              <div className="space-y-2">
                {warnings.map((w, i) => (
                  <div key={i} className="text-xs text-yellow-200/70 bg-yellow-500/10 p-2 rounded flex gap-2 items-start">
                    <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tools */}
          <div className="p-5">
             <button
              onClick={toggleConstraints}
              className={cn(
                "w-full py-2 px-4 rounded text-sm font-medium transition-colors border",
                showConstraints 
                  ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/50 hover:bg-indigo-500/30" 
                  : "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
              )}
            >
              {showConstraints ? 'Hide Constraints' : 'Show Constraints'}
            </button>
          </div>
        </>
      )}

      {/* Selected Element */}
      {selectedElement && (
        <div className="p-5 flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-1">Selected Element</h3>
            <div className="text-lg font-bold text-zinc-100 flex items-center justify-between">
              <span className="capitalize">{selectedElement.type}</span>
              {selectedElement.hidden && <span className="text-[10px] bg-zinc-800 px-2 py-0.5 rounded text-zinc-400">HIDDEN</span>}
            </div>
          </div>

          {/* Properties editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Visibility</span>
              <button 
                onClick={() => updateElement(selectedElement.id, { hidden: !selectedElement.hidden })}
                className="text-xs bg-zinc-800 hover:bg-zinc-700 px-2 py-1 rounded"
              >
                {selectedElement.hidden ? 'Show' : 'Hide'}
              </button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-zinc-400">Lock State</span>
              <button 
                onClick={() => updateElement(selectedElement.id, { locked: !selectedElement.locked })}
                className={cn("text-xs px-2 py-1 rounded", selectedElement.locked ? "bg-indigo-500/20 text-indigo-300" : "bg-zinc-800 hover:bg-zinc-700")}
              >
                {selectedElement.locked ? 'Locked' : 'Unlocked'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Dimensions</span>
              <span className="font-mono">{Math.round(selectedElement.width)} × {Math.round(selectedElement.height)}</span>
            </div>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Position</span>
              <span className="font-mono">{Math.round(selectedElement.x)}, {Math.round(selectedElement.y)}</span>
            </div>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Priority</span>
              <span className="font-mono">{selectedElement.priority} / 10</span>
            </div>
            <div className="bg-zinc-900 p-2 rounded border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase mb-0.5">Behaviors</span>
              <span className="text-[10px] capitalize leading-tight block">{selectedElement.behavior.join(', ')}</span>
            </div>
          </div>

          {/* Decision Trace */}
          <div className="mt-2">
            <h3 className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-3">Decision Trace</h3>
            {elementDecisions.length === 0 ? (
              <p className="text-xs text-zinc-500 italic">No transformations applied in this pass.</p>
            ) : (
              <div className="relative border-l border-zinc-800 ml-2 pl-4 py-1 space-y-4">
                {elementDecisions.map((d, i) => (
                  <div key={i} className="relative">
                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-800 border-2 border-indigo-500" />
                    <div className="text-[10px] text-zinc-500 font-mono mb-0.5">
                      {String(d.sequence).padStart(2, '0')} — {d.reason}
                    </div>
                    <div className="text-xs text-zinc-200">
                      {d.action}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <button
              onClick={() => useStore.getState().selectElement(null)}
              className="mt-4 w-full py-1.5 px-4 rounded text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Clear Selection
            </button>
        </div>
      )}
    </div>
  );
}

function MetricRow({ pass, label }: { pass: boolean, label: string }) {
  return (
    <div className="flex items-center gap-3">
      {pass ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
      <span className={cn("text-zinc-300", !pass && "text-zinc-400")}>{label}</span>
    </div>
  );
}
