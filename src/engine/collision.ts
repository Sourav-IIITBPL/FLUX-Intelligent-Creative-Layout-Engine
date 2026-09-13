import { Bounds, Collision, CreativeElement, Surface } from './types';

export function getBounds(el: CreativeElement): Bounds {
  return {
    x: el.x,
    y: el.y,
    width: el.width,
    height: el.height,
  };
}

export function detectIntersection(b1: Bounds, b2: Bounds): boolean {
  return (
    b1.x < b2.x + b2.width &&
    b1.x + b1.width > b2.x &&
    b1.y < b2.y + b2.height &&
    b1.y + b1.height > b2.y
  );
}

export function calculateOverlapArea(b1: Bounds, b2: Bounds): number {
  const xOverlap = Math.max(0, Math.min(b1.x + b1.width, b2.x + b2.width) - Math.max(b1.x, b2.x));
  const yOverlap = Math.max(0, Math.min(b1.y + b1.height, b2.y + b2.height) - Math.max(b1.y, b2.y));
  return xOverlap * yOverlap;
}

export function checkCollisions(elements: CreativeElement[]): Collision[] {
  const collisions: Collision[] = [];
  const visibleElements = elements.filter(e => !e.hidden);

  for (let i = 0; i < visibleElements.length; i++) {
    for (let j = i + 1; j < visibleElements.length; j++) {
      const e1 = visibleElements[i];
      const e2 = visibleElements[j];

      // Exclude decorative elements from critical collisions if they are behind (we can simplify for now)
      // Backgrounds/decorative can overlap. Let's ignore decorative collisions for simplicity unless specified.
      if (e1.type === 'decorative' || e2.type === 'decorative') continue;

      const b1 = getBounds(e1);
      const b2 = getBounds(e2);

      if (detectIntersection(b1, b2)) {
        const area = calculateOverlapArea(b1, b2);
        collisions.push({
          elementId1: e1.id,
          elementId2: e2.id,
          severity: area > (b1.width * b1.height * 0.1) ? 'error' : 'warning',
          overlapArea: area,
        });
      }
    }
  }

  return collisions;
}

export const SAFE_ZONE_PADDING = {
  desktop: 60,
  tablet: 40,
  mobile: 24,
  story: 32,
  square: 48,
};

export function getSafeZone(surface: Surface): Bounds {
  const padding = SAFE_ZONE_PADDING[surface.type] || 24;
  return {
    x: padding,
    y: padding,
    width: surface.width - padding * 2,
    height: surface.height - padding * 2,
  };
}

export function isOutOfBounds(el: CreativeElement, container: Bounds): boolean {
  if (el.hidden) return false;
  return (
    el.x < container.x ||
    el.y < container.y ||
    el.x + el.width > container.x + container.width ||
    el.y + el.height > container.y + container.height
  );
}
