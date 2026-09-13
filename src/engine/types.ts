export type SurfaceType = 'desktop' | 'tablet' | 'mobile' | 'story' | 'square';

export interface Surface {
  type: SurfaceType;
  width: number;
  height: number;
  label: string;
  aspectRatio: string;
}

export const SURFACES: Record<SurfaceType, Surface> = {
  desktop: { type: 'desktop', width: 1920, height: 1080, label: 'Desktop', aspectRatio: '16:9' },
  tablet:  { type: 'tablet',  width: 1024, height: 768,  label: 'Tablet',  aspectRatio: '4:3'  },
  mobile:  { type: 'mobile',  width: 390,  height: 844,  label: 'Mobile',  aspectRatio: '9:16' },
  story:   { type: 'story',   width: 1080, height: 1920, label: 'Story',   aspectRatio: '9:16' },
  square:  { type: 'square',  width: 1080, height: 1080, label: 'Square',  aspectRatio: '1:1'  },
};

export type ElementType = 'headline' | 'subtitle' | 'product' | 'cta' | 'badge' | 'decorative' | 'hotspot';

export type ElementBehavior = 'preserve' | 'shrink' | 'reposition' | 'stack' | 'hide' | 'crop' | 'scale';

export interface Point {
  x: number;
  y: number;
}

export interface Bounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ResponsiveBehavior {
  desktop: ElementBehavior;
  tablet: ElementBehavior;
  mobile: ElementBehavior;
  story: ElementBehavior;
  square: ElementBehavior;
}

export interface TypographyRule {
  desktopSize: number;
  tabletSize: number;
  mobileSize: number;
  storySize: number;
  squareSize: number;
  minSize: number;
  maxSize: number;
}

export type ConstraintType =
  | 'above'
  | 'below'
  | 'left-of'
  | 'right-of'
  | 'contains'
  | 'inside-safe-zone'
  | 'min-target-size';

export interface ElementConstraint {
  type: ConstraintType;
  targetId?: string;
  value?: number;
}

export interface CreativeElement {
  id: string;
  type: ElementType;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  // Extended priority system
  visualPriority: number;       // 0–100
  interactionPriority: number;  // 0–100
  hidePriority: number;         // 0–100, higher = hide later
  // Legacy compat
  priority: number;             // (visualPriority + interactionPriority) / 20
  minWidth: number;
  minHeight: number;
  locked: boolean;
  preferredZones: ('top' | 'bottom' | 'center' | 'left' | 'right')[];
  behavior: ElementBehavior[];
  responsiveBehavior?: ResponsiveBehavior;
  interactive: boolean;
  focalPoint?: Point;
  content?: string;
  imageUrl?: string;
  hidden?: boolean;
  typographyRule?: TypographyRule;
  constraints?: ElementConstraint[];
}

export interface Collision {
  elementId1: string;
  elementId2: string;
  severity: 'warning' | 'error';
  overlapArea: number;
}

export interface LayoutWarning {
  elementId?: string;
  message: string;
  type: 'safe-zone' | 'min-size' | 'hidden' | 'focal-point' | 'cta-visibility' | 'collision' | 'typography';
}

export interface LayoutDecision {
  elementId: string;
  reason: string;
  action: string;
  sequence: number;
  deltaX?: number;
  deltaY?: number;
  deltaWidth?: number;
  deltaHeight?: number;
  /** 0–1, mathematically derived from constraint satisfaction ratio */
  confidence?: number;
}

export interface LayoutMetrics {
  ctaVisible: boolean;
  productFocalPointPreserved: boolean;
  safeZoneCompliant: boolean;
  interactiveTargetSizeOk: boolean;
  textReadabilityOk: boolean;
  hierarchyScore: number;
  whitespaceScore: number;
  overflowCount: number;
}

export interface CandidateLayout {
  id: number;
  elements: CreativeElement[];
  score: number;
  collisions: Collision[];
  description: string;
}

export interface EngineProfilerData {
  layoutCalcMs: number;
  collisionPassMs: number;
  scoringMs: number;
  candidateGenMs: number;
  candidateCount: number;
  elementCount: number;
  totalMs: number;
}

export interface EngineEvent {
  timestamp: number;
  type: string;
  data: string;
}

export interface LayoutResult {
  surface: Surface;
  elements: CreativeElement[];
  collisions: Collision[];
  warnings: LayoutWarning[];
  score: number;
  decisions: LayoutDecision[];
  metrics: LayoutMetrics;
  calculationTimeMs: number;
  candidates: CandidateLayout[];
  selectedCandidateId: number;
  profiler: EngineProfilerData;
}

export interface EngineWeights {
  priority: number;
  collisionPenalty: number;
  safeZone: number;
  focalPoint: number;
  ctaPreservation: number;
  hierarchy: number;
  whitespace: number;
  interaction: number;
}

export const DEFAULT_WEIGHTS: EngineWeights = {
  priority: 1.0,
  collisionPenalty: 2.0,
  safeZone: 1.5,
  focalPoint: 1.8,
  ctaPreservation: 2.5,
  hierarchy: 1.2,
  whitespace: 0.8,
  interaction: 2.0,
};

export interface BreakpointFailure {
  width: number;
  failures: { elementId: string; issue: string; severity: 'warning' | 'error' }[];
  score: number;
}

export interface AccessibilityResult {
  targetSizeOk: boolean;
  contrastOk: boolean;
  textReadable: boolean;
  hierarchyCorrect: boolean;
  ctaVisible: boolean;
  score: number;
  issues: { message: string; severity: 'warning' | 'error' }[];
}

export interface CreativePreset {
  id: string;
  name: string;
  tagline: string;
  cta: string;
  accent: string;
  accentDark: string;
  elements: CreativeElement[];
}

export interface LayoutSnapshot {
  id: string;
  label: string;
  timestamp: number;
  elements: CreativeElement[];
  weights: EngineWeights;
  surfaceType: SurfaceType;
}
