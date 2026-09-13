import { create } from 'zustand';
import {
  CreativeElement, EngineWeights, DEFAULT_WEIGHTS,
  SurfaceType, SURFACES, LayoutResult, LayoutSnapshot,
  EngineEvent,
} from '../engine/types';
import { calculateLayout } from '../engine/layoutEngine';
import { PRESETS, AURA_ELEMENTS } from '../data/presets';

// ─── Engine Event Log ─────────────────────────────────────────────────────────

const MAX_EVENTS = 80;

function mkEvent(type: string, data: string): EngineEvent {
  return { timestamp: Date.now(), type, data };
}

// ─── State interface ──────────────────────────────────────────────────────────

interface AppState {
  // Navigation
  activeTab: 'editor' | 'matrix' | 'lab' | 'stress' | 'accessibility' | 'rdtools';

  // Creative
  activePresetId: string;
  baseElements: CreativeElement[];

  // Surface
  currentSurfaceType: SurfaceType;
  viewportWidth: number; // continuous slider, 320–1920

  // Engine config
  weights: EngineWeights;

  // UI state
  showConstraints: boolean;
  showSafeZone: boolean;
  showFocalPoint: boolean;
  showBoundingBoxes: boolean;
  showInteractionZones: boolean;
  selectedElementId: string | null;
  canvasZoom: number; // 0.5–1.5

  // Engine results
  currentResult: LayoutResult | null;
  allSurfaceResults: Partial<Record<SurfaceType, LayoutResult>>;

  // Undo / redo
  history: CreativeElement[][];
  historyIndex: number;

  // Snapshots (localStorage)
  snapshots: LayoutSnapshot[];

  // Engine event log
  events: EngineEvent[];

  // Chaos test
  chaosActive: boolean;

  // Actions
  setActiveTab: (tab: AppState['activeTab']) => void;
  setPreset: (id: string) => void;
  setSurface: (surface: SurfaceType) => void;
  setViewportWidth: (w: number) => void;
  setWeights: (weights: Partial<EngineWeights>) => void;
  setCanvasZoom: (zoom: number) => void;
  toggleConstraints: () => void;
  toggleSafeZone: () => void;
  toggleFocalPoint: () => void;
  toggleBoundingBoxes: () => void;
  toggleInteractionZones: () => void;
  selectElement: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<CreativeElement>) => void;
  recalculate: () => void;
  recalculateAll: () => void;
  resetLayout: () => void;
  undo: () => void;
  redo: () => void;
  saveSnapshot: (label: string) => void;
  loadSnapshot: (id: string) => void;
  deleteSnapshot: (id: string) => void;
  injectChaos: () => void;
  clearChaos: () => void;
  addEvent: (type: string, data: string) => void;
  exportJSON: () => string;
}

// ─── Helper: recalculate for a surface ───────────────────────────────────────

function runLayout(
  elements: CreativeElement[],
  surfaceType: SurfaceType,
  weights: EngineWeights
): LayoutResult {
  return calculateLayout(elements, SURFACES[surfaceType], weights);
}

// ─── Store ────────────────────────────────────────────────────────────────────

const storedSnapshots = (): LayoutSnapshot[] => {
  try {
    return JSON.parse(localStorage.getItem('flux-snapshots') ?? '[]');
  } catch { return []; }
};

export const useStore = create<AppState>((set, get) => ({
  activeTab: 'editor',
  activePresetId: 'aura',
  baseElements: AURA_ELEMENTS,
  currentSurfaceType: 'desktop',
  viewportWidth: 1920,
  weights: DEFAULT_WEIGHTS,
  showConstraints: false,
  showSafeZone: false,
  showFocalPoint: false,
  showBoundingBoxes: false,
  showInteractionZones: false,
  selectedElementId: null,
  canvasZoom: 1,
  currentResult: null,
  allSurfaceResults: {},
  history: [AURA_ELEMENTS],
  historyIndex: 0,
  snapshots: storedSnapshots(),
  events: [],
  chaosActive: false,

  setActiveTab: (tab) => set({ activeTab: tab }),

  setPreset: (id) => {
    const preset = PRESETS.find(p => p.id === id);
    if (!preset) return;
    set({ activePresetId: id, baseElements: preset.elements, history: [preset.elements], historyIndex: 0 });
    get().addEvent('PRESET_CHANGED', `Loaded preset: ${preset.name}`);
    get().recalculate();
    get().recalculateAll();
  },

  setSurface: (type) => {
    set({ currentSurfaceType: type, viewportWidth: SURFACES[type].width });
    get().addEvent('SURFACE_CHANGED', `Switched to ${SURFACES[type].label} (${SURFACES[type].width}×${SURFACES[type].height})`);
    get().recalculate();
  },

  setViewportWidth: (w) => {
    set({ viewportWidth: w });
    // Derive nearest surface type
    const type: SurfaceType = w >= 1280 ? 'desktop' : w >= 768 ? 'tablet' : 'mobile';
    const surface = { ...SURFACES[type], width: w, height: Math.round(w * (SURFACES[type].height / SURFACES[type].width)) };
    const { baseElements, weights } = get();
    const result = calculateLayout(baseElements, surface, weights);
    set({ currentResult: result });
  },

  setWeights: (newW) => {
    set(s => ({ weights: { ...s.weights, ...newW } }));
  },

  setCanvasZoom: (zoom) => set({ canvasZoom: zoom }),

  toggleConstraints: () => set(s => ({ showConstraints: !s.showConstraints })),
  toggleSafeZone:    () => set(s => ({ showSafeZone:    !s.showSafeZone    })),
  toggleFocalPoint:  () => set(s => ({ showFocalPoint:  !s.showFocalPoint  })),
  toggleBoundingBoxes: () => set(s => ({ showBoundingBoxes: !s.showBoundingBoxes })),
  toggleInteractionZones: () => set(s => ({ showInteractionZones: !s.showInteractionZones })),

  selectElement: (id) => set({ selectedElementId: id }),

  updateElement: (id, updates) => {
    const { baseElements, history, historyIndex } = get();
    const newElements = baseElements.map(e => e.id === id ? { ...e, ...updates } : e);
    // Trim forward history
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    set({ baseElements: newElements, history: newHistory, historyIndex: newHistory.length - 1 });
    get().recalculate();
  },

  recalculate: () => {
    const { baseElements, currentSurfaceType, weights } = get();
    const t0 = performance.now();
    get().addEvent('LAYOUT_RECALCULATE', `Surface: ${SURFACES[currentSurfaceType].label}, Elements: ${baseElements.length}`);
    const result = runLayout(baseElements, currentSurfaceType, weights);
    const ms = (performance.now() - t0).toFixed(2);
    get().addEvent('LAYOUT_COMPLETE', `Score: ${result.score} | Collisions: ${result.collisions.length} | ${ms}ms`);
    set({ currentResult: result });
  },

  recalculateAll: () => {
    const { baseElements, weights } = get();
    const allSurfaceResults: Partial<Record<SurfaceType, LayoutResult>> = {};
    (Object.keys(SURFACES) as SurfaceType[]).forEach(type => {
      allSurfaceResults[type] = runLayout(baseElements, type, weights);
    });
    set({ allSurfaceResults });
  },

  resetLayout: () => {
    const preset = PRESETS.find(p => p.id === get().activePresetId) ?? PRESETS[0];
    set({ baseElements: preset.elements, history: [preset.elements], historyIndex: 0, chaosActive: false });
    get().addEvent('LAYOUT_RESET', `Reset to preset: ${preset.name}`);
    get().recalculate();
    get().recalculateAll();
  },

  undo: () => {
    const { history, historyIndex } = get();
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    set({ baseElements: history[newIndex], historyIndex: newIndex });
    get().recalculate();
  },

  redo: () => {
    const { history, historyIndex } = get();
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    set({ baseElements: history[newIndex], historyIndex: newIndex });
    get().recalculate();
  },

  saveSnapshot: (label) => {
    const { baseElements, weights, currentSurfaceType, snapshots } = get();
    const snap: LayoutSnapshot = {
      id: `snap-${Date.now()}`,
      label,
      timestamp: Date.now(),
      elements: baseElements,
      weights,
      surfaceType: currentSurfaceType,
    };
    const newSnaps = [snap, ...snapshots].slice(0, 10);
    localStorage.setItem('flux-snapshots', JSON.stringify(newSnaps));
    set({ snapshots: newSnaps });
    get().addEvent('SNAPSHOT_SAVED', `Saved: "${label}"`);
  },

  loadSnapshot: (id) => {
    const snap = get().snapshots.find(s => s.id === id);
    if (!snap) return;
    set({ baseElements: snap.elements, weights: snap.weights, currentSurfaceType: snap.surfaceType });
    get().addEvent('SNAPSHOT_LOADED', `Loaded: "${snap.label}"`);
    get().recalculate();
  },

  deleteSnapshot: (id) => {
    const newSnaps = get().snapshots.filter(s => s.id !== id);
    localStorage.setItem('flux-snapshots', JSON.stringify(newSnaps));
    set({ snapshots: newSnaps });
  },

  injectChaos: () => {
    const { baseElements } = get();
    const chaotic = baseElements.map(e => {
      if (e.type === 'cta') return { ...e, width: 600, minWidth: 600 }; // CTA too wide
      if (e.type === 'headline') return { ...e, width: 2000 };           // overflow
      if (e.type === 'badge') return { ...e, locked: true, x: -200 };   // locked out of bounds
      return e;
    });
    set({ baseElements: chaotic, chaosActive: true });
    get().addEvent('CHAOS_INJECTED', 'Oversized CTA, overflowing headline, locked OOB badge');
    get().recalculate();
  },

  clearChaos: () => {
    get().resetLayout();
    set({ chaosActive: false });
    get().addEvent('CHAOS_CLEARED', 'Layout restored from chaos');
  },

  addEvent: (type, data) => {
    set(s => ({
      events: [mkEvent(type, data), ...s.events].slice(0, MAX_EVENTS),
    }));
  },

  exportJSON: () => {
    const { baseElements, weights, currentSurfaceType, currentResult } = get();
    return JSON.stringify({
      meta: { tool: 'FLUX', version: '2.0', exported: new Date().toISOString() },
      preset: get().activePresetId,
      surface: currentSurfaceType,
      weights,
      elements: baseElements,
      layoutResult: currentResult ? {
        score: currentResult.score,
        collisions: currentResult.collisions.length,
        warnings: currentResult.warnings.length,
        metrics: currentResult.metrics,
      } : null,
    }, null, 2);
  },
}));
