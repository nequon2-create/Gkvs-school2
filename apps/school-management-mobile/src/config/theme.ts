/**
 * Apple Design System Tokens & Human Interface Guidelines for GKVS Mobile
 * Derived from Apple WWDC "Designing Fluid Interfaces" & iOS Human Interface Guidelines
 */

export const AppleColors = {
  // Brand & Accent Colors
  primary: '#007AFF',            // Apple System Blue / Action Blue
  primaryDark: '#0051A8',
  primaryLight: '#EBF5FF',
  brandNavy: '#1D4ED8',          // Cohesive with Admin-Web --apple-blue

  // System Semantic Colors (iOS HIG)
  success: '#34C759',            // Apple Green
  successLight: '#E8F9EE',
  warning: '#FF9500',            // Apple Amber / Orange
  warningLight: '#FFF4E5',
  error: '#FF3B30',              // Apple Red
  errorLight: '#FFECEB',
  purple: '#AF52DE',             // Apple Purple
  teal: '#5AC8FA',               // Apple Teal

  // Light Mode Surfaces (Default Trust & Education)
  background: '#F2F2F7',         // Apple System Grouped Background
  surface: '#FFFFFF',            // Card / Sheet surface
  surfaceSecondary: '#F8F9FA',   // Inset grouped list surface
  surfaceElevated: '#FFFFFF',

  // Text / Label Hierarchy (WCAG AAA / AA compliant)
  textPrimary: '#000000',        // Primary Title & Body (100%)
  textSecondary: '#6C6C70',      // Secondary subhead / helper (60% equivalent)
  textTertiary: '#8E8E93',       // Tertiary placeholder / caption (40% equivalent)
  textInverse: '#FFFFFF',

  // Dividers & Borders
  separator: 'rgba(60, 60, 67, 0.12)',      // 1px standard iOS separator
  borderSubtle: 'rgba(60, 60, 67, 0.08)',
  borderLight: '#E5E5EA',

  // Materials & Overlays
  scrim: 'rgba(0, 0, 0, 0.35)',
  cardHighlight: 'rgba(0, 122, 255, 0.06)',
  glassBackground: 'rgba(255, 255, 255, 0.85)',
};

export const AppleTypography = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
    color: AppleColors.textPrimary,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
    letterSpacing: -0.4,
    color: AppleColors.textPrimary,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
    color: AppleColors.textPrimary,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
    color: AppleColors.textPrimary,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
    letterSpacing: -0.4,
    color: AppleColors.textPrimary,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
    letterSpacing: -0.4,
    color: AppleColors.textPrimary,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '500' as const,
    letterSpacing: -0.3,
    color: AppleColors.textPrimary,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
    letterSpacing: -0.2,
    color: AppleColors.textSecondary,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
    letterSpacing: -0.1,
    color: AppleColors.textSecondary,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
    letterSpacing: 0,
    color: AppleColors.textTertiary,
  },
};

export const AppleRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  card: 18,
  pill: 9999,
};

export const AppleShadows = {
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  floating: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const AppleSprings = {
  // Damping 1.0 equivalent for critically-damped clean response
  snappy: {
    damping: 20,
    stiffness: 250,
    mass: 0.8,
  },
  // Under-damped slight bounce for flick / physical feedback
  momentum: {
    damping: 15,
    stiffness: 180,
    mass: 1,
  },
};
