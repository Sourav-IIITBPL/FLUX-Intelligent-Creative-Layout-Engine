import { CreativeElement, ElementBehavior, Surface } from './types';

/** Return the per-surface behavior for an element */
export function getSurfaceBehavior(el: CreativeElement, surface: Surface): ElementBehavior {
  if (el.responsiveBehavior) return el.responsiveBehavior[surface.type];
  if (el.behavior.includes('preserve')) return 'preserve';
  if (el.behavior.includes('hide')) return 'hide';
  if (el.behavior.includes('stack')) return 'stack';
  if (el.behavior.includes('reposition')) return 'reposition';
  if (el.behavior.includes('shrink')) return 'shrink';
  return 'preserve';
}
