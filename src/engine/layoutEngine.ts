import { CreativeElement, EngineWeights, LayoutDecision, LayoutResult, LayoutWarning, Surface, Bounds } from './types';
import { checkCollisions, getSafeZone, isOutOfBounds } from './collision';
import { calculateScore } from './scoring';

function cloneElements(elements: CreativeElement[]): CreativeElement[] {
  return elements.map(e => ({ ...e, behavior: [...e.behavior], preferredZones: [...e.preferredZones] }));
}

export function calculateLayout(
  elements: CreativeElement[],
  surface: Surface,
  weights: EngineWeights
): LayoutResult {
  const startTime = performance.now();
  let currentElements = cloneElements(elements);
  const decisions: LayoutDecision[] = [];
  const warnings: LayoutWarning[] = [];
  let sequence = 1;

  const safeZone = getSafeZone(surface);

  // Helper to add decision
  const addDecision = (elementId: string, reason: string, action: string) => {
    decisions.push({ elementId, reason, action, sequence: sequence++ });
  };

  // Sort elements by priority (descending)
  currentElements.sort((a, b) => b.priority - a.priority);

  // 1. Initial placement and scaling constraints
  for (const el of currentElements) {
    if (el.locked) continue;

    // Apply simple scaling/shrinking based on surface width if allowed
    if (el.behavior.includes('shrink')) {
      const maxWidth = safeZone.width;
      if (el.width > maxWidth) {
        const ratio = el.height / el.width;
        const newWidth = Math.max(maxWidth, el.minWidth);
        const newHeight = newWidth * ratio;
        
        if (newWidth !== el.width) {
          addDecision(el.id, 'Available width decreased', `SHRINK to ${Math.round(newWidth)}x${Math.round(newHeight)}`);
          el.width = newWidth;
          el.height = newHeight;
        }
      }
    }
  }

  // 2. Repositioning & Safe Zone alignment
  // Naive stacked layout for simpler shapes on smaller surfaces, or preserve original layout
  const isMobile = surface.type === 'mobile' || surface.type === 'story';
  
  if (isMobile) {
    let currentY = safeZone.y;
    const padding = 16;
    
    // For mobile, we might want to stack elements vertically.
    // Let's place product first if it exists, or just flow them.
    // To make it deterministic and look good, let's look at preferred zones.
    
    const layoutFlow = ['headline', 'subtitle', 'product', 'badge', 'decorative', 'hotspot', 'cta'];
    
    currentElements.forEach(el => {
      if (el.locked || el.type === 'decorative') return;
      
      if (el.behavior.includes('reposition') || el.behavior.includes('stack')) {
        // Center horizontally
        const newX = (surface.width - el.width) / 2;
        if (el.x !== newX || el.y !== currentY) {
          addDecision(el.id, 'Surface changed to vertical orientation', `REPOSITION X:${Math.round(newX)}, Y:${Math.round(currentY)}`);
          el.x = newX;
          el.y = currentY;
        }
        currentY += el.height + padding;
      }
    });

    // Special handling for CTA: Pin to bottom if preferred
    const cta = currentElements.find(e => e.type === 'cta');
    if (cta && cta.preferredZones.includes('bottom')) {
      const newY = surface.height - safeZone.y - cta.height;
      if (cta.y !== newY) {
        addDecision(cta.id, 'CTA visibility preservation', `PIN TO BOTTOM Y:${Math.round(newY)}`);
        cta.y = newY;
      }
    }
  } else {
    // Desktop/Tablet: Constrain to safe zone without completely destroying original positions
    currentElements.forEach(el => {
      if (el.locked || el.type === 'decorative') return;

      if (el.behavior.includes('reposition')) {
        let moved = false;
        let newX = el.x;
        let newY = el.y;

        if (newX < safeZone.x) { newX = safeZone.x; moved = true; }
        if (newY < safeZone.y) { newY = safeZone.y; moved = true; }
        if (newX + el.width > safeZone.x + safeZone.width) { 
          newX = safeZone.x + safeZone.width - el.width; 
          moved = true; 
        }
        if (newY + el.height > safeZone.y + safeZone.height) { 
          newY = safeZone.y + safeZone.height - el.height; 
          moved = true; 
        }

        if (moved) {
          addDecision(el.id, 'Safe zone constraint triggered', `REPOSITION to remain within safe zone`);
          el.x = newX;
          el.y = newY;
        }
      }
    });
  }

  // 3. Collision resolution (basic push down)
  let collisions = checkCollisions(currentElements);
  if (collisions.length > 0) {
    for (const collision of collisions) {
      const el1 = currentElements.find(e => e.id === collision.elementId1)!;
      const el2 = currentElements.find(e => e.id === collision.elementId2)!;
      
      if (el1.locked || el2.locked) continue;
      
      // Move the lower priority element
      const [toMove, anchor] = el1.priority < el2.priority ? [el1, el2] : [el2, el1];
      
      if (toMove.behavior.includes('reposition')) {
        const moveDistance = anchor.y + anchor.height + 16 - toMove.y;
        if (moveDistance > 0) {
           toMove.y += moveDistance;
           addDecision(toMove.id, `Collision with ${anchor.type} detected`, `REPOSITION +${Math.round(moveDistance)}px Y`);
        }
      } else if (toMove.behavior.includes('hide')) {
        toMove.hidden = true;
        addDecision(toMove.id, `Unresolvable collision with ${anchor.type}`, `HIDE low priority element`);
      }
    }
  }

  // 4. Final check and metrics
  collisions = checkCollisions(currentElements);
  const { score, metrics } = calculateScore(currentElements, surface, weights, collisions);

  // Generate Warnings
  collisions.forEach(c => {
    warnings.push({ type: 'safe-zone', message: `Collision between ${c.elementId1} and ${c.elementId2}` });
  });

  if (!metrics.ctaVisible) {
    warnings.push({ type: 'cta-visibility', message: 'CTA is not fully visible or out of bounds' });
  }

  if (!metrics.productFocalPointPreserved) {
    warnings.push({ type: 'focal-point', message: 'Product focal point is obscured' });
  }

  const endTime = performance.now();

  return {
    surface,
    elements: currentElements,
    collisions,
    warnings,
    score,
    decisions,
    metrics,
    calculationTimeMs: endTime - startTime,
  };
}
