import { Collision, CreativeElement, EngineWeights, LayoutMetrics, Surface } from './types';
import { getSafeZone, isOutOfBounds } from './collision';

export function calculateScore(
  elements: CreativeElement[],
  surface: Surface,
  weights: EngineWeights,
  collisions: Collision[]
): { score: number; metrics: LayoutMetrics } {
  let score = 100;
  const safeZone = getSafeZone(surface);
  let safeZoneCompliant = true;
  let ctaVisible = false;
  let productFocalPointPreserved = true;
  let interactiveTargetSizeOk = true;
  let textReadabilityOk = true;

  const visible = elements.filter(e => !e.hidden);

  // 1. Collision penalty — weighted by severity
  const errorColls = collisions.filter(c => c.severity === 'error');
  score -= collisions.length * weights.collisionPenalty * 2;
  score -= errorColls.length * weights.collisionPenalty * 3;

  // 2. Safe zone compliance
  for (const el of visible) {
    if (el.type !== 'decorative' && isOutOfBounds(el, safeZone)) {
      safeZoneCompliant = false;
      score -= weights.safeZone * 5;
    }
    if ((el.type === 'headline' || el.type === 'subtitle') &&
        (el.width < el.minWidth || el.height < el.minHeight)) {
      textReadabilityOk = false;
      score -= weights.priority * 4;
    }
  }

  // 3. CTA visibility + interactive target size
  const cta = elements.find(e => e.type === 'cta');
  if (cta) {
    ctaVisible = !cta.hidden &&
      !isOutOfBounds(cta, { x: 0, y: 0, width: surface.width, height: surface.height });
    if (!ctaVisible) score -= weights.ctaPreservation * 10;
    if (ctaVisible && (cta.width < 44 || cta.height < 44)) {
      interactiveTargetSizeOk = false;
      score -= weights.interaction * 3;
    }
  }

  // 4. Focal point preservation
  const product = elements.find(e => e.type === 'product');
  if (product?.focalPoint) {
    const fx = product.x + product.focalPoint.x;
    const fy = product.y + product.focalPoint.y;
    for (const el of visible) {
      if (el.id !== product.id && el.type !== 'decorative') {
        if (fx >= el.x && fx <= el.x + el.width && fy >= el.y && fy <= el.y + el.height) {
          productFocalPointPreserved = false;
          score -= weights.focalPoint * 8;
          break;
        }
      }
    }
  }

  // 5. Hierarchy score — high visual-priority elements should be visible
  let hierarchyScore = 100;
  const highPri = elements.filter(e => e.visualPriority > 70);
  const hiddenHighPri = highPri.filter(e => e.hidden);
  hierarchyScore -= hiddenHighPri.length * 20;
  score -= (100 - hierarchyScore) * weights.hierarchy * 0.1;

  // 6. Whitespace balance — occupancy 35–75% is ideal
  const totalArea = surface.width * surface.height;
  const occupiedArea = visible.reduce((acc, el) => acc + el.width * el.height, 0);
  const occupancy = Math.min(1, occupiedArea / totalArea);
  const idealMin = 0.35, idealMax = 0.75;
  const whitespaceScore = (occupancy >= idealMin && occupancy <= idealMax)
    ? 100
    : Math.max(0, 100 - Math.abs(occupancy - (idealMin + idealMax) / 2) * 200);
  score -= (100 - whitespaceScore) * weights.whitespace * 0.08;

  // 7. Overflow penalty
  const overflowCount = visible.filter(el =>
    el.type !== 'decorative' &&
    isOutOfBounds(el, { x: 0, y: 0, width: surface.width, height: surface.height })
  ).length;
  score -= overflowCount * 6;

  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    metrics: {
      ctaVisible,
      productFocalPointPreserved,
      safeZoneCompliant,
      interactiveTargetSizeOk,
      textReadabilityOk,
      hierarchyScore: Math.max(0, hierarchyScore),
      whitespaceScore: Math.round(whitespaceScore),
      overflowCount,
    },
  };
}
