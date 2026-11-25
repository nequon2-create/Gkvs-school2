/**
 * Apple Design Tokens for the GKVS School Management Monorepo
 * Grounded in Apple WWDC "Designing Fluid Interfaces" & iOS Human Interface Guidelines
 */

export const APPLE_DESIGN_TOKENS = {
  colors: {
    primary: '#007AFF',            // Apple System Blue / Action Blue
    primaryHover: '#0051A8',
    brandBlue: '#2563EB',          // Institution Brand Blue
    brandNavy: '#1E40AF',
    
    // Status & Semantic
    success: '#34C759',            // Apple Green
    warning: '#FF9500',            // Apple Amber
    error: '#FF3B30',              // Apple Red
    purple: '#AF52DE',             // Apple Purple
    teal: '#5AC8FA',               // Apple Teal

    // Light Theme Surfaces
    background: '#F2F2F7',         // Apple System Grouped Background
    surface: '#FFFFFF',            // Standard Card Surface
    surfaceSecondary: '#F8F9FA',   // Secondary Inset Surface

    // Labels & Text (WCAG Compliant)
    textPrimary: '#000000',
    textSecondary: '#6C6C70',
    textTertiary: '#8E8E93',
    textInverse: '#FFFFFF',

    // Separators
    separator: 'rgba(60, 60, 67, 0.12)',
    borderLight: '#E5E5EA',
  },
  typography: {
    fontSans: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", sans-serif',
    fontMono: '"SF Mono", "Monaco", "Cascadia Code", monospace',
    trackingTight: '-0.025em',
    trackingNormal: '0',
    trackingLooser: '0.015em',
  },
  materials: {
    glassBackground: 'rgba(255, 255, 255, 0.72)',
    glassBorder: 'rgba(255, 255, 255, 0.45)',
    glassBackdrop: 'blur(20px) saturate(180%)',
    glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.06)',
  },
  springs: {
    dampingRatio: 1.0,  // Critically damped default
    momentumDamping: 0.8, // Under-damped slight bounce for flick
    responseSeconds: 0.35,
  },
} as const;
