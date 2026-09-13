import { Surface, TypographyRule } from './types';

export const DEFAULT_TYPOGRAPHY: Record<string, TypographyRule> = {
  headline: { desktopSize: 96, tabletSize: 64, mobileSize: 40, storySize: 56, squareSize: 72, minSize: 28, maxSize: 120 },
  subtitle: { desktopSize: 28, tabletSize: 22, mobileSize: 16, storySize: 20, squareSize: 24, minSize: 14, maxSize: 40 },
  cta:      { desktopSize: 18, tabletSize: 16, mobileSize: 14, storySize: 16, squareSize: 16, minSize: 12, maxSize: 22 },
  badge:    { desktopSize: 12, tabletSize: 11, mobileSize: 10, storySize: 11, squareSize: 11, minSize: 10, maxSize: 14 },
};

/** Returns the exact font size for a given surface */
export function computeFontSize(rule: TypographyRule, surface: Surface): number {
  const sizeMap: Record<string, number> = {
    desktop: rule.desktopSize,
    tablet:  rule.tabletSize,
    mobile:  rule.mobileSize,
    story:   rule.storySize,
    square:  rule.squareSize,
  };
  const raw = sizeMap[surface.type] ?? rule.desktopSize;
  return Math.max(rule.minSize, Math.min(rule.maxSize, raw));
}

/** Fluid typography interpolated from viewport width — no breakpoint jumps */
export function computeFluidFontSize(rule: TypographyRule, viewportWidth: number): number {
  const t = Math.max(0, Math.min(1, (viewportWidth - 320) / (1920 - 320)));
  const size = rule.mobileSize + t * (rule.desktopSize - rule.mobileSize);
  return Math.max(rule.minSize, Math.min(rule.maxSize, Math.round(size)));
}
