import { AccessibilityResult, CreativeElement, Surface } from './types';
import { isOutOfBounds } from './collision';

/**
 * Analyzes the rendered layout for accessibility compliance.
 * All checks are derived from actual element state — no hardcoded values.
 */
export function analyzeAccessibility(
  elements: CreativeElement[],
  surface: Surface
): AccessibilityResult {
  const issues: { message: string; severity: 'warning' | 'error' }[] = [];
  const visible = elements.filter(e => !e.hidden);

  // 1. Interactive target size (WCAG 2.5.5 — 44×44px minimum)
  let targetSizeOk = true;
  for (const el of visible) {
    if (el.interactive) {
      if (el.width < 44 || el.height < 44) {
        targetSizeOk = false;
        issues.push({
          message: `${el.label}: target ${Math.round(el.width)}×${Math.round(el.height)}px below 44×44px minimum`,
          severity: 'error',
        });
      } else if (el.width < 48 || el.height < 48) {
        issues.push({
          message: `${el.label}: target ${Math.round(el.width)}×${Math.round(el.height)}px — recommend 48×48px`,
          severity: 'warning',
        });
      }
    }
  }

  // 2. Text readability proxy — element below minHeight indicates clipping
  let textReadable = true;
  for (const el of visible) {
    if (el.type === 'headline' || el.type === 'subtitle') {
      if (el.height < el.minHeight) {
        textReadable = false;
        issues.push({
          message: `${el.label}: height ${Math.round(el.height)}px below min ${el.minHeight}px — text may be clipped`,
          severity: 'error',
        });
      } else if (el.type === 'subtitle' && el.height < el.minHeight * 1.2) {
        issues.push({
          message: `${el.label}: subtitle at threshold — contrast may degrade`,
          severity: 'warning',
        });
      }
    }
  }

  // 3. CTA visibility
  const cta = elements.find(e => e.type === 'cta');
  const ctaVisible = !!cta && !cta.hidden &&
    !isOutOfBounds(cta, { x: 0, y: 0, width: surface.width, height: surface.height });
  if (!ctaVisible) {
    issues.push({ message: 'Primary CTA is not visible on this surface', severity: 'error' });
  }

  // 4. Heading hierarchy: headline hidden but subtitle visible = broken hierarchy
  const headline = elements.find(e => e.type === 'headline');
  const subtitle  = elements.find(e => e.type === 'subtitle');
  const hierarchyCorrect = !(headline?.hidden && !subtitle?.hidden);
  if (!hierarchyCorrect) {
    issues.push({
      message: 'Headline hidden while subtitle is visible — breaks heading hierarchy',
      severity: 'error',
    });
  }

  // 5. Contrast proxy: subtitle at near-minimum height in dark theme is a risk
  let contrastOk = true;
  for (const el of visible) {
    if (el.type === 'subtitle' && el.height < el.minHeight * 1.1) {
      contrastOk = false;
      issues.push({
        message: `${el.label}: small rendered size may reduce effective contrast ratio`,
        severity: 'warning',
      });
    }
  }

  // Score: 100 - deductions per issue
  let score = 100;
  score -= issues.filter(i => i.severity === 'error').length * 15;
  score -= issues.filter(i => i.severity === 'warning').length * 5;
  score = Math.max(0, score);

  return { targetSizeOk, contrastOk, textReadable, hierarchyCorrect, ctaVisible, score, issues };
}
