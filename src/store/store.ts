import { create } from 'zustand';
import { CreativeElement, EngineWeights, DEFAULT_WEIGHTS, SurfaceType, SURFACES, LayoutResult, calculateLayout } from '../engine';

interface AppState {
  // Config
  currentSurfaceType: SurfaceType;
  weights: EngineWeights;
  showConstraints: boolean;
  
  // Data
  baseElements: CreativeElement[]; // The canonical elements for desktop
  currentResult: LayoutResult | null;
  selectedElementId: string | null;
  
  // Actions
  setSurface: (surface: SurfaceType) => void;
  setWeights: (weights: Partial<EngineWeights>) => void;
  toggleConstraints: () => void;
  selectElement: (id: string | null) => void;
  updateElement: (id: string, updates: Partial<CreativeElement>) => void;
  recalculate: () => void;
  resetLayout: () => void;
}

const DEMO_ELEMENTS: CreativeElement[] = [
  {
    id: 'bg-1',
    type: 'decorative',
    x: 0,
    y: 0,
    width: 1920,
    height: 1080,
    priority: 1,
    minWidth: 320,
    minHeight: 320,
    locked: false,
    preferredZones: ['center'],
    behavior: ['shrink', 'preserve'],
    interactive: false,
    content: 'background'
  },
  {
    id: 'prod-1',
    type: 'product',
    x: 960,
    y: 140,
    width: 800,
    height: 800,
    priority: 10,
    minWidth: 280,
    minHeight: 280,
    locked: false,
    preferredZones: ['right', 'center'],
    behavior: ['shrink', 'reposition', 'stack'],
    interactive: false,
    focalPoint: { x: 400, y: 400 },
  },
  {
    id: 'head-1',
    type: 'headline',
    x: 120,
    y: 300,
    width: 800,
    height: 200,
    priority: 9,
    minWidth: 300,
    minHeight: 80,
    locked: false,
    preferredZones: ['left', 'top'],
    behavior: ['shrink', 'reposition', 'stack'],
    interactive: false,
    content: 'AURA',
  },
  {
    id: 'sub-1',
    type: 'subtitle',
    x: 120,
    y: 520,
    width: 600,
    height: 100,
    priority: 8,
    minWidth: 280,
    minHeight: 40,
    locked: false,
    preferredZones: ['left', 'top'],
    behavior: ['shrink', 'reposition', 'stack'],
    interactive: false,
    content: 'Immersive sound, without boundaries.',
  },
  {
    id: 'cta-1',
    type: 'cta',
    x: 120,
    y: 700,
    width: 240,
    height: 64,
    priority: 9,
    minWidth: 200,
    minHeight: 48,
    locked: false,
    preferredZones: ['left', 'bottom'],
    behavior: ['reposition', 'stack'],
    interactive: true,
    content: 'Experience AURA',
  },
  {
    id: 'badge-1',
    type: 'badge',
    x: 120,
    y: 120,
    width: 140,
    height: 40,
    priority: 5,
    minWidth: 100,
    minHeight: 32,
    locked: false,
    preferredZones: ['top', 'left'],
    behavior: ['reposition', 'hide'],
    interactive: false,
    content: 'NEW RELEASE',
  },
  {
    id: 'hotspot-1',
    type: 'hotspot',
    x: 1200,
    y: 600,
    width: 48,
    height: 48,
    priority: 7,
    minWidth: 44,
    minHeight: 44,
    locked: false,
    preferredZones: ['center'],
    behavior: ['reposition', 'hide'],
    interactive: true,
  }
];

export const useStore = create<AppState>((set, get) => ({
  currentSurfaceType: 'desktop',
  weights: DEFAULT_WEIGHTS,
  showConstraints: false,
  baseElements: DEMO_ELEMENTS,
  currentResult: null,
  selectedElementId: null,

  setSurface: (type) => {
    set({ currentSurfaceType: type });
    get().recalculate();
  },
  
  setWeights: (newWeights) => {
    set((state) => ({ weights: { ...state.weights, ...newWeights } }));
  },
  
  toggleConstraints: () => set((state) => ({ showConstraints: !state.showConstraints })),
  
  selectElement: (id) => set({ selectedElementId: id }),
  
  updateElement: (id, updates) => {
    set((state) => {
      const newBase = state.baseElements.map(e => e.id === id ? { ...e, ...updates } : e);
      return { baseElements: newBase };
    });
    get().recalculate();
  },
  
  recalculate: () => {
    const { baseElements, currentSurfaceType, weights } = get();
    const surface = SURFACES[currentSurfaceType];
    const result = calculateLayout(baseElements, surface, weights);
    set({ currentResult: result });
  },
  
  resetLayout: () => {
    set({ baseElements: [...DEMO_ELEMENTS] });
    get().recalculate();
  }
}));
