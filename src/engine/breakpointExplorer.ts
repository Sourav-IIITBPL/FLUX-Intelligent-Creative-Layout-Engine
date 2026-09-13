import { BreakpointFailure, CreativeElement, EngineWeights, SurfaceType } from './types';
import { calculateLayout } from './layoutEngine';

const BREAKPOINTS = [1920, 1440, 1280, 1024, 768, 600, 480, 390, 320];

function surfaceTypeForWidth(w: number): SurfaceType {
  if (w >= 1024) return 'desktop';
  if (w >= 768)  return 'tablet';
  return 'mobile';
}

/**
 * Runs the layout engine against every breakpoint and returns
 * a structured failure analysis — no mocked values.
 */
export function runBreakpointExplorer(
  elements: CreativeElement[],
  weights: EngineWeights
): BreakpointFailure[] {
  return BREAKPOINTS.map(width => {
    const type = surfaceTypeForWidth(width);
    const isPortrait = width < 768;
    const height = isPortrait
      ? Math.round(width * 16 / 9)
      : Math.round(width * 9 / 16);

    const surface = {
      type,
      width,
      height,
      label: `${width}px`,
      aspectRatio: isPortrait ? '9:16' : '16:9',
    };

    const result = calculateLayout(elements, surface, weights);
    const failures: BreakpointFailure['failures'] = [];

    for (const el of result.elements) {
      if (el.hidden && el.visualPriority > 50) {
        failures.push({
          elementId: el.id,
          issue: `${el.label} hidden (priority ${el.visualPriority})`,
          severity: 'warning',
        });
      }
      if (!el.hidden && (el.width < el.minWidth || el.height < el.minHeight)) {
        failures.push({
          elementId: el.id,
          issue: `${el.label} below minimum dimensions (${Math.round(el.width)}×${Math.round(el.height)})`,
          severity: 'error',
        });
      }
    }

    result.collisions.forEach(c => {
      failures.push({
        elementId: c.elementId1,
        issue: `Collision: ${c.elementId1} ↔ ${c.elementId2}`,
        severity: c.severity,
      });
    });

    return { width, failures, score: result.score };
  });
}
