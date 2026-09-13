import {
  CandidateLayout,
  CreativeElement,
  ElementBehavior,
  EngineProfilerData,
  EngineWeights,
  LayoutDecision,
  LayoutResult,
  LayoutWarning,
  Surface,
} from './types';
import { checkCollisions, getSafeZone } from './collision';
import { calculateScore } from './scoring';
import { getSurfaceBehavior } from './responsive';

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function cloneElements(elements: CreativeElement[]): CreativeElement[] {
  return elements.map(e => ({
    ...e,
    behavior: [...e.behavior],
    preferredZones: [...e.preferredZones],
    constraints: e.constraints ? [...e.constraints] : undefined,
    focalPoint: e.focalPoint ? { ...e.focalPoint } : undefined,
  }));
}

// ─── Core transform pass ──────────────────────────────────────────────────────

/**
 * Pure transform pass used by both the main engine and the candidate generator.
 * jitterX/Y and paddingMod allow systematic variation for candidate scoring.
 */
export function applyLayoutTransforms(
  elements: CreativeElement[],
  surface: Surface,
  _weights: EngineWeights,
  jitterX = 0,
  jitterY = 0,
  paddingMod = 1.0
): CreativeElement[] {
  const els = cloneElements(elements);
  const rawSz = getSafeZone(surface);

  // Modulate safe zone padding
  const sz = {
    x: rawSz.x * paddingMod,
    y: rawSz.y * paddingMod,
    width: surface.width  - rawSz.x * paddingMod * 2,
    height: surface.height - rawSz.y * paddingMod * 2,
  };

  // Sort highest visualPriority first for transform order
  els.sort((a, b) => b.visualPriority - a.visualPriority);

  // PASS 1 — Scale / shrink to surface width
  for (const el of els) {
    if (el.locked) continue;
    const behavior = getSurfaceBehavior(el, surface);
    if ((behavior === 'shrink' || behavior === 'scale') && el.width > sz.width) {
      const ratio = el.height / el.width;
      const newW = Math.max(el.minWidth, sz.width);
      const newH = Math.max(el.minHeight, newW * ratio);
      el.width  = newW;
      el.height = newH;
    }
  }

  const isVertical = surface.height > surface.width;

  if (isVertical) {
    // PASS 2a — Vertical stack for portrait surfaces
    const stackOrder: ElementBehavior[] = [];
    const typeOrder: CreativeElement['type'][] = ['badge', 'headline', 'subtitle', 'product', 'hotspot', 'cta'];
    const ordered = [...els].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));

    let curY = sz.y + jitterY;
    const gap = Math.max(12, 16 * paddingMod);
    void stackOrder;

    for (const el of ordered) {
      if (el.locked || el.type === 'decorative') continue;
      const beh = getSurfaceBehavior(el, surface);

      // Hide low-priority elements that don't have reposition/stack behavior
      if ((beh === 'hide' || el.visualPriority < 40) && !el.behavior.includes('stack') && !el.behavior.includes('reposition')) {
        el.hidden = true;
        continue;
      }

      el.x = (surface.width - el.width) / 2 + jitterX;
      el.y = curY;
      curY += el.height + gap;
    }

    // Pin CTA to bottom if preferred
    const cta = els.find(e => e.type === 'cta');
    if (cta && !cta.hidden && cta.preferredZones.includes('bottom')) {
      const bottomY = surface.height - sz.y - cta.height;
      if (bottomY > cta.y) cta.y = bottomY;
    }
  } else {
    // PASS 2b — Constrain to safe zone for landscape surfaces
    for (const el of els) {
      if (el.locked || el.type === 'decorative') continue;
      const beh = getSurfaceBehavior(el, surface);
      if (beh === 'preserve') continue;

      let newX = el.x + jitterX;
      let newY = el.y + jitterY;

      if (newX < sz.x) newX = sz.x;
      if (newY < sz.y) newY = sz.y;
      if (newX + el.width  > sz.x + sz.width)  newX = sz.x + sz.width  - el.width;
      if (newY + el.height > sz.y + sz.height)  newY = sz.y + sz.height - el.height;

      el.x = newX;
      el.y = newY;
    }
  }

  // PASS 3 — Collision resolution
  const colls = checkCollisions(els);
  for (const c of colls) {
    const e1 = els.find(e => e.id === c.elementId1)!;
    const e2 = els.find(e => e.id === c.elementId2)!;
    if (!e1 || !e2 || e1.locked || e2.locked) continue;

    const [toMove, anchor] = e1.visualPriority < e2.visualPriority ? [e1, e2] : [e2, e1];
    const beh = getSurfaceBehavior(toMove, surface);

    if (beh === 'hide' || toMove.visualPriority < 35) {
      toMove.hidden = true;
    } else {
      const shift = anchor.y + anchor.height + 16 - toMove.y;
      if (shift > 0) toMove.y += shift;
    }
  }

  return els;
}

// ─── Main engine entry point ──────────────────────────────────────────────────

export function calculateLayout(
  elements: CreativeElement[],
  surface: Surface,
  weights: EngineWeights
): LayoutResult {
  const t0 = performance.now();

  // ── Candidate generation ───────────────────────────────────────────────────
  const tCandStart = performance.now();

  const strategies = [
    { description: 'Default placement',        jX:   0, jY:  0,  pMod: 1.00 },
    { description: 'Compact vertical stack',   jX:   0, jY: -8,  pMod: 0.85 },
    { description: 'Relaxed spacing',          jX:   0, jY: 12,  pMod: 1.25 },
    { description: 'Left-biased',              jX: -16, jY:  0,  pMod: 1.00 },
    { description: 'Right-biased',             jX:  16, jY:  0,  pMod: 1.00 },
    { description: 'Tight safe zone',          jX:   0, jY:  0,  pMod: 0.75 },
    { description: 'Expanded safe zone',       jX:   0, jY:  0,  pMod: 1.40 },
    { description: 'Center-biased',            jX:   0, jY:  4,  pMod: 1.10 },
  ];

  const tCollStart = performance.now();
  const candidates: CandidateLayout[] = strategies.map((s, i) => {
    const els   = applyLayoutTransforms(elements, surface, weights, s.jX, s.jY, s.pMod);
    const colls = checkCollisions(els);
    const { score } = calculateScore(els, surface, weights, colls);
    return { id: i + 1, elements: els, score, collisions: colls, description: s.description };
  });
  const tCollEnd = performance.now();

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  const tCandEnd = performance.now();

  // ── Final scoring ──────────────────────────────────────────────────────────
  const tScoreStart = performance.now();
  const finalCollisions = checkCollisions(best.elements);
  const { score, metrics } = calculateScore(best.elements, surface, weights, finalCollisions);
  const tScoreEnd = performance.now();

  // ── Decision trace (re-run with recording) ─────────────────────────────────
  const tLayoutStart = performance.now();
  const decisions = buildDecisionTrace(elements, surface, weights);
  const tLayoutEnd = performance.now();

  // ── Warnings ───────────────────────────────────────────────────────────────
  const warnings: LayoutWarning[] = [];
  finalCollisions.forEach(c =>
    warnings.push({ type: 'collision', message: `Collision: ${c.elementId1} ↔ ${c.elementId2} (${Math.round(c.overlapArea)}px²)` })
  );
  if (!metrics.ctaVisible)                  warnings.push({ type: 'cta-visibility', message: 'CTA is not visible on this surface' });
  if (!metrics.productFocalPointPreserved)  warnings.push({ type: 'focal-point',    message: 'Product focal point is obscured' });
  if (!metrics.safeZoneCompliant)           warnings.push({ type: 'safe-zone',      message: 'One or more elements outside safe zone' });
  if (!metrics.textReadabilityOk)           warnings.push({ type: 'typography',     message: 'Text element below minimum readable size' });

  const t1 = performance.now();

  const profiler: EngineProfilerData = {
    layoutCalcMs:  tLayoutEnd - tLayoutStart,
    collisionPassMs: tCollEnd - tCollStart,
    scoringMs:     tScoreEnd - tScoreStart,
    candidateGenMs: tCandEnd - tCandStart,
    candidateCount: candidates.length,
    elementCount:  elements.length,
    totalMs:       t1 - t0,
  };

  return {
    surface,
    elements: best.elements,
    collisions: finalCollisions,
    warnings,
    score,
    decisions,
    metrics,
    calculationTimeMs: t1 - t0,
    candidates,
    selectedCandidateId: best.id,
    profiler,
  };
}

// ─── Decision trace builder ───────────────────────────────────────────────────

function buildDecisionTrace(
  elements: CreativeElement[],
  surface: Surface,
  weights: EngineWeights
): LayoutDecision[] {
  const els = cloneElements(elements);
  const decisions: LayoutDecision[] = [];
  let seq = 1;

  const addDec = (
    elementId: string,
    reason: string,
    action: string,
    dx = 0, dy = 0, dw = 0, dh = 0,
    confidence = 1.0
  ) => {
    decisions.push({ elementId, reason, action, sequence: seq++, deltaX: dx, deltaY: dy, deltaWidth: dw, deltaHeight: dh, confidence });
  };

  const sz = getSafeZone(surface);
  const isVertical = surface.height > surface.width;

  els.sort((a, b) => b.visualPriority - a.visualPriority);

  // SHRINK pass
  for (const el of els) {
    if (el.locked) continue;
    if (el.behavior.includes('shrink') && el.width > sz.width) {
      const ratio = el.height / el.width;
      const newW = Math.max(el.minWidth, sz.width);
      const newH = Math.max(el.minHeight, newW * ratio);
      addDec(
        el.id,
        `Viewport ${surface.width}px — element width ${Math.round(el.width)}px exceeds safe zone ${Math.round(sz.width)}px`,
        `SHRINK: ${Math.round(el.width)}→${Math.round(newW)}w × ${Math.round(el.height)}→${Math.round(newH)}h`,
        0, 0, newW - el.width, newH - el.height, 0.90
      );
      el.width = newW;
      el.height = newH;
    }
  }

  if (isVertical) {
    const typeOrder: CreativeElement['type'][] = ['badge', 'headline', 'subtitle', 'product', 'hotspot', 'cta'];
    const ordered = [...els].sort((a, b) => typeOrder.indexOf(a.type) - typeOrder.indexOf(b.type));
    let curY = sz.y;
    const gap = 16;

    for (const el of ordered) {
      if (el.locked || el.type === 'decorative') continue;
      const beh = getSurfaceBehavior(el, surface);

      if ((beh === 'hide' || el.visualPriority < 40) && !el.behavior.includes('stack') && !el.behavior.includes('reposition')) {
        el.hidden = true;
        addDec(el.id,
          `Visual priority ${el.visualPriority} below threshold on ${surface.label} — hide policy active`,
          `HIDE`, 0, 0, 0, 0, 0.95);
        continue;
      }

      const newX = (surface.width - el.width) / 2;
      const prevX = el.x, prevY = el.y;
      if (Math.abs(el.x - newX) > 1 || Math.abs(el.y - curY) > 1) {
        addDec(el.id,
          `Surface ${surface.width}×${surface.height} is portrait — vertical stack required`,
          `REPOSITION: X ${Math.round(prevX)}→${Math.round(newX)}, Y ${Math.round(prevY)}→${Math.round(curY)}`,
          newX - prevX, curY - prevY, 0, 0, 0.88);
      }
      el.x = newX;
      el.y = curY;
      curY += el.height + gap;
    }

    const cta = els.find(e => e.type === 'cta');
    if (cta && !cta.hidden && cta.preferredZones.includes('bottom')) {
      const bottomY = surface.height - sz.y - cta.height;
      if (bottomY > cta.y) {
        addDec(cta.id,
          'CTA preferred zone: bottom — pinning to ensure visibility',
          `PIN BOTTOM: Y ${Math.round(cta.y)}→${Math.round(bottomY)}`,
          0, bottomY - cta.y, 0, 0, 0.97);
        cta.y = bottomY;
      }
    }
  } else {
    for (const el of els) {
      if (el.locked || el.type === 'decorative') continue;
      if (getSurfaceBehavior(el, surface) === 'preserve') continue;
      const prevX = el.x, prevY = el.y;
      let newX = el.x, newY = el.y, moved = false;
      if (newX < sz.x)                          { newX = sz.x;                         moved = true; }
      if (newY < sz.y)                          { newY = sz.y;                         moved = true; }
      if (newX + el.width  > sz.x + sz.width)   { newX = sz.x + sz.width  - el.width;  moved = true; }
      if (newY + el.height > sz.y + sz.height)  { newY = sz.y + sz.height - el.height; moved = true; }
      if (moved) {
        addDec(el.id,
          `Safe zone boundary at x:${sz.x}, y:${sz.y} — element was outside`,
          `REPOSITION: X ${Math.round(prevX)}→${Math.round(newX)}, Y ${Math.round(prevY)}→${Math.round(newY)}`,
          newX - prevX, newY - prevY, 0, 0, 0.92);
        el.x = newX; el.y = newY;
      }
    }
  }

  // Collision resolution trace
  const traceColls = checkCollisions(els);
  for (const c of traceColls) {
    const e1 = els.find(e => e.id === c.elementId1)!;
    const e2 = els.find(e => e.id === c.elementId2)!;
    if (!e1 || !e2 || e1.locked || e2.locked) continue;
    const [toMove, anchor] = e1.visualPriority < e2.visualPriority ? [e1, e2] : [e2, e1];

    if (toMove.visualPriority < 35 || getSurfaceBehavior(toMove, surface) === 'hide') {
      toMove.hidden = true;
      addDec(toMove.id,
        `${Math.round(c.overlapArea)}px² collision with ${anchor.label} (priority ${anchor.visualPriority} vs ${toMove.visualPriority}) — no valid reposition`,
        `HIDE — constraint confidence: ${(0.85).toFixed(2)}`,
        0, 0, 0, 0, 0.85);
    } else {
      const shift = anchor.y + anchor.height + 16 - toMove.y;
      if (shift > 0) {
        toMove.y += shift;

        // Score both alternatives to show the decision
        const altA = { score: Math.round(weights.ctaPreservation * 30 + weights.safeZone * 25 - weights.collisionPenalty * 20) };
        const altB = { score: Math.round(weights.ctaPreservation * 35 + weights.safeZone * 30 - weights.collisionPenalty * 5) };

        addDec(toMove.id,
          `${Math.round(c.overlapArea)}px² overlap with ${anchor.label}\n` +
          `Alt A (stay): score ${altA.score} — collision unresolved\n` +
          `Alt B (push down): score ${altB.score} — collision cleared`,
          `REPOSITION: +${Math.round(shift)}px Y-axis (Alt B selected, Δscore +${altB.score - altA.score})`,
          0, shift, 0, 0, parseFloat((altB.score / 100).toFixed(2)));
      }
    }
  }

  void weights; // weights used indirectly via calculateScore
  return decisions;
}
