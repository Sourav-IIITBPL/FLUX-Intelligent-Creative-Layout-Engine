export type SurfaceType = 'desktop' | 'tablet' | 'mobile' | 'story' | 'square';

export interface Surface {
  type: SurfaceType;
  width: number;
  height: number;
  label: string;
}

export const SURFACES: Record<SurfaceType, Surface> = {
  desktop: { type: 'desktop', width: 1920, height: 1080, label: 'Desktop 16:9' },
  tablet: { type: 'tablet', width: 1024, height: 768, label: 'Tablet 4:3' },
  mobile: { type: 'mobile', width: 390, height: 844, label: 'Mobile 9:16' },
  story: { type: 'story', width: 1080, height: 1920, label: 'Social Story 9:16' },
  square: { type: 'square', width: 1080, height: 1080, label: 'Square 1:1' },
};

export type ElementType = 'headline' | 'subtitle' | 'product' | 'cta' | 'badge' | 'decorative' | 'hotspot';

export type ElementBehavior = 'preserve' | 'shrink' | 'reposition' | 'stack' | 'hide';

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

export interface CreativeElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  priority: number; // 1-10, higher is more important
  minWidth: number;
  minHeight: number;
  locked: boolean;
  preferredZones: ('top' | 'bottom' | 'center' | 'left' | 'right')[];
  behavior: ElementBehavior[];
  interactive: boolean;
  focalPoint?: Point;
  content?: string;
  imageUrl?: string;
  hidden?: boolean;
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
  type: 'safe-zone' | 'min-size' | 'hidden' | 'focal-point' | 'cta-visibility';
}

export interface LayoutDecision {
  elementId: string;
  reason: string;
  action: string;
  sequence: number;
}

export interface LayoutMetrics {
  ctaVisible: boolean;
  productFocalPointPreserved: boolean;
  safeZoneCompliant: boolean;
  interactiveTargetSizeOk: boolean;
  textReadabilityOk: boolean;
}

export interface LayoutResult {
  surface: Surface;
  elements: CreativeElement[];
  collisions: Collision[];
  warnings: LayoutWarning[];
  score: number; // 0-100
  decisions: LayoutDecision[];
  metrics: LayoutMetrics;
  calculationTimeMs: number;
}

export interface EngineWeights {
  priority: number;
  collisionPenalty: number;
  safeZone: number;
  focalPoint: number;
  ctaPreservation: number;
}

export const DEFAULT_WEIGHTS: EngineWeights = {
  priority: 1.0,
  collisionPenalty: 2.0,
  safeZone: 1.5,
  focalPoint: 1.8,
  ctaPreservation: 2.5,
};
