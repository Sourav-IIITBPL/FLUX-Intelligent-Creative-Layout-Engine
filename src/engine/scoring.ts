import { Collision, CreativeElement, EngineWeights, LayoutMetrics, LayoutResult, Surface } from './types';
import { checkCollisions, getSafeZone, isOutOfBounds } from './collision';

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

  const visibleElements = elements.filter(e => !e.hidden);

  // 1. Penalize for collisions
  if (collisions.length > 0) {
    const errorCollisions = collisions.filter(c => c.severity === 'error');
    score -= collisions.length * weights.collisionPenalty + errorCollisions.length * (weights.collisionPenalty * 2);
  }

  // 2. Safe zone compliance
  for (const el of visibleElements) {
    if (el.type !== 'decorative' && isOutOfBounds(el, safeZone)) {
      safeZoneCompliant = false;
      score -= weights.safeZone * 5;
    }
    
    // Check minimum dimensions for text readability
    if (el.type === 'headline' || el.type === 'subtitle') {
      if (el.width < el.minWidth || el.height < el.minHeight) {
        textReadabilityOk = false;
        score -= weights.priority * 5;
      }
    }
  }

  // 3. CTA Visibility
  const cta = elements.find(e => e.type === 'cta');
  if (cta) {
    ctaVisible = !cta.hidden && !isOutOfBounds(cta, { x: 0, y: 0, width: surface.width, height: surface.height });
    if (!ctaVisible) {
      score -= weights.ctaPreservation * 10;
    }
    // Interactive target size
    if (ctaVisible && (cta.width < 44 || cta.height < 44)) {
      interactiveTargetSizeOk = false;
      score -= weights.priority * 2;
    }
  }

  // 4. Product focal point
  const product = elements.find(e => e.type === 'product');
  if (product && product.focalPoint) {
    // Check if any element overlaps the focal point
    const focalPointAbs = {
      x: product.x + product.focalPoint.x,
      y: product.y + product.focalPoint.y,
    };
    
    for (const el of visibleElements) {
      if (el.id !== product.id && el.type !== 'decorative') {
        if (
          focalPointAbs.x >= el.x && focalPointAbs.x <= el.x + el.width &&
          focalPointAbs.y >= el.y && focalPointAbs.y <= el.y + el.height
        ) {
          productFocalPointPreserved = false;
          score -= weights.focalPoint * 8;
          break;
        }
      }
    }
  }

  // Cap score between 0 and 100
  score = Math.max(0, Math.min(100, Math.round(score)));

  return {
    score,
    metrics: {
      ctaVisible,
      productFocalPointPreserved,
      safeZoneCompliant,
      interactiveTargetSizeOk,
      textReadabilityOk,
    }
  };
}
