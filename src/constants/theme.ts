// constants/theme.ts
// CampusHub — Premium Design System
// Inspired by Apple Human Interface, Linear, Arc Browser

export const Typography = {
  // Display — cinematic headings
  display: {
    fontFamily: 'SF Pro Display',  // falls back to system font
    large: { fontSize: 48, fontWeight: '700' as const, letterSpacing: -1.5, lineHeight: 56 },
    medium: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -1.0, lineHeight: 44 },
    small: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 34 },
    // Backwards-compat aliases used across the codebase
    md: { fontSize: 36, fontWeight: '700' as const, letterSpacing: -1.0, lineHeight: 44 },
    sm: { fontSize: 28, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 34 },
    xs: { fontSize: 20, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 24 },
  },
  // Titles — between display and headline
  title: {
    lg: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.6, lineHeight: 28 },
    md: { fontSize: 18, fontWeight: '700' as const, letterSpacing: -0.4, lineHeight: 24 },
    sm: { fontSize: 16, fontWeight: '600' as const, letterSpacing: -0.3, lineHeight: 22 },
  },
  // Headlines
  headline: {
    xl: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.8, lineHeight: 30 },
    lg: { fontSize: 20, fontWeight: '600' as const, letterSpacing: -0.6, lineHeight: 26 },
    md: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.4, lineHeight: 22 },
    sm: { fontSize: 15, fontWeight: '600' as const, letterSpacing: -0.2, lineHeight: 20 },
  },
  // Body
  body: {
    lg: { fontSize: 17, fontWeight: '400' as const, letterSpacing: -0.2, lineHeight: 26 },
    md: { fontSize: 15, fontWeight: '400' as const, letterSpacing: -0.1, lineHeight: 22 },
    sm: { fontSize: 13, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 18 },
  },
  // Labels
  label: {
    lg: { fontSize: 13, fontWeight: '600' as const, letterSpacing: 0.2, lineHeight: 16 },
    md: { fontSize: 12, fontWeight: '600' as const, letterSpacing: 0.4, lineHeight: 14 },
    sm: { fontSize: 11, fontWeight: '500' as const, letterSpacing: 0.6, lineHeight: 13 },
    xs: { fontSize: 10, fontWeight: '600' as const, letterSpacing: 0.8, lineHeight: 12 },
  },
  // Caption
  caption: { fontSize: 12, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 16 },
  // Mono
  mono: { fontFamily: 'SF Mono', fontSize: 13, fontWeight: '400' as const, letterSpacing: 0, lineHeight: 18 },
};

// ─── Dark Theme (AMOLED) ────────────────────────────────────────────────────
export const DarkTheme = {
  mode: 'dark' as const,
  colors: {
    // Backgrounds — true black → surface → elevated
    void:       '#000000',   // pure AMOLED black
    background: '#080808',   // near-black page bg
    surface:    '#0F0F0F',   // card base
    surfaceElevated: '#161616', // raised cards
    surfaceOverlay:  '#1C1C1C', // modals, sheets

    // Separators & borders
    border:        'rgba(255,255,255,0.08)',
    borderStrong:  'rgba(255,255,255,0.14)',
    borderFocus:   'rgba(255,255,255,0.30)',

    // Text hierarchy
    textPrimary:   '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.60)',
    textTertiary:  'rgba(255,255,255,0.35)',
    textDisabled:  'rgba(255,255,255,0.20)',
    textInverse:   '#000000',

    // Brand — electric indigo
    primary:       '#6366F1',
    primaryLight:  '#818CF8',
    primaryDark:   '#4F46E5',
    primaryMuted:  'rgba(99,102,241,0.15)',
    primaryGlow:   'rgba(99,102,241,0.25)',

    // Accent — electric violet
    accent:        '#A78BFA',
    accentMuted:   'rgba(167,139,250,0.15)',

    // Semantic
    success:       '#34D399',
    successMuted:  'rgba(52,211,153,0.15)',
    warning:       '#FBBF24',
    warningMuted:  'rgba(251,191,36,0.15)',
    danger:        '#F87171',
    dangerMuted:   'rgba(248,113,113,0.15)',
    info:          '#60A5FA',
    infoMuted:     'rgba(96,165,250,0.15)',

    // Special
    gold:          '#F59E0B',
    goldMuted:     'rgba(245,158,11,0.15)',

    // Glassmorphism
    glass:         'rgba(255,255,255,0.04)',
    glassBorder:   'rgba(255,255,255,0.08)',
    glassMedium:   'rgba(255,255,255,0.07)',
    glassStrong:   'rgba(255,255,255,0.10)',
    surfaceGlass:  'rgba(255,255,255,0.06)',

    // Gradients (as arrays for LinearGradient)
    gradientHero:   ['#0D0D1A', '#000000'],
    gradientBrand:  ['#4F46E5', '#7C3AED'],
    gradientCard:   ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.02)'],
    gradientGlow:   ['rgba(99,102,241,0.20)', 'rgba(99,102,241,0.00)'],
    gradientSuccess:['rgba(52,211,153,0.20)', 'rgba(52,211,153,0.00)'],
    gradientDanger: ['rgba(248,113,113,0.20)', 'rgba(248,113,113,0.00)'],
  },
} as const;

// ─── Light Theme (Elegant) ──────────────────────────────────────────────────
export const LightTheme = {
  mode: 'light' as const,
  colors: {
    void:       '#F2F2F7',
    background: '#F2F2F7',
    surface:    '#FFFFFF',
    surfaceElevated: '#FFFFFF',
    surfaceOverlay:  '#FFFFFF',

    border:        'rgba(0,0,0,0.05)',
    borderStrong:  'rgba(0,0,0,0.10)',
    borderFocus:   'rgba(0,0,0,0.30)',

    textPrimary:   '#0D0D0D',
    textSecondary: 'rgba(0,0,0,0.55)',
    textTertiary:  'rgba(0,0,0,0.35)',
    textDisabled:  'rgba(0,0,0,0.20)',
    textInverse:   '#FFFFFF',

    primary:       '#4F46E5',
    primaryLight:  '#6366F1',
    primaryDark:   '#3730A3',
    primaryMuted:  'rgba(79,70,229,0.08)',
    primaryGlow:   'rgba(79,70,229,0.15)',

    accent:        '#7C3AED',
    accentMuted:   'rgba(124,58,237,0.10)',

    success:       '#059669',
    successMuted:  'rgba(5,150,105,0.10)',
    warning:       '#D97706',
    warningMuted:  'rgba(217,119,6,0.10)',
    danger:        '#DC2626',
    dangerMuted:   'rgba(220,38,38,0.10)',
    info:          '#2563EB',
    infoMuted:     'rgba(37,99,235,0.10)',

    gold:          '#B45309',
    goldMuted:     'rgba(180,83,9,0.10)',

    glass:         'rgba(255,255,255,0.70)',
    glassBorder:   'rgba(0,0,0,0.07)',
    glassMedium:   'rgba(255,255,255,0.80)',
    glassStrong:   'rgba(255,255,255,0.90)',
    surfaceGlass:  'rgba(255,255,255,0.45)',

    gradientHero:   ['#E8E8F0', '#F2F2F7'],
    gradientBrand:  ['#4F46E5', '#7C3AED'],
    gradientCard:   ['rgba(255,255,255,0.90)', 'rgba(255,255,255,0.60)'],
    gradientGlow:   ['rgba(79,70,229,0.10)', 'rgba(79,70,229,0.00)'],
    gradientSuccess:['rgba(5,150,105,0.12)', 'rgba(5,150,105,0.00)'],
    gradientDanger: ['rgba(220,38,38,0.12)', 'rgba(220,38,38,0.00)'],
  },
} as const;

// ─── Active Theme export (re-exported by ThemeContext) ───────────────────────
export type AppTheme = typeof DarkTheme | typeof LightTheme;
export type ThemeColors = AppTheme['colors'];

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
  huge: 48,
  full: 999,
  page: { horizontal: 20, top: 16 },
} as const;

// ─── Radius ──────────────────────────────────────────────────────────────────
export const Radius = {
  xs:   6,
  sm:   10,
  md:   14,
  lg:   18,
  xl:   24,
  xxl:  32,
  pill: 100,
  circle: 999,
  full: 999,
} as const;

// Default export for files that haven't been migrated to ThemeContext yet
export const Theme = {
  ...DarkTheme,
  spacing: Spacing,
  radius: Radius,
  typography: {
    hero: Typography.display.large,
    title: Typography.headline.xl,
    subtitle: Typography.headline.lg,
    body: Typography.body.md,
    caption: Typography.caption,
    micro: Typography.label.xs,
  },
  gradients: {
    primary: ['#4F46E5', '#7C3AED'] as const,
    ambient: ['rgba(99,102,241,0.12)', 'rgba(15,23,42,0.00)'] as const,
    glowPurple: ['rgba(167,139,250,0.20)', 'rgba(167,139,250,0.00)'] as const,
    glowBlue: ['rgba(96,165,250,0.20)', 'rgba(96,165,250,0.00)'] as const,
  } as const,
} as const;

// ─── Shadows ─────────────────────────────────────────────────────────────────
export const Shadows = {
  // iOS shadow style objects — calibrated for both light and dark themes
  // Light mode: keep shadows very subtle (Apple HIG: shadows should not dominate)
  // Dark mode: same values work since card backgrounds are already dark
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  cardLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  float: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 10,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 8,
  }),
} as const;

// ─── Animation presets ────────────────────────────────────────────────────────
export const Animation = {
  // Spring configs for Reanimated
  spring: {
    gentle:   { damping: 20, stiffness: 200, mass: 0.8 },
    snappy:   { damping: 18, stiffness: 280, mass: 0.6 },
    bouncy:   { damping: 12, stiffness: 220, mass: 0.9 },
    stiff:    { damping: 28, stiffness: 350, mass: 0.7 },
  },
  // Timing
  duration: {
    instant:  80,
    fast:     150,
    normal:   250,
    slow:     400,
    cinematic:600,
  },
  // Entry delays (stagger)
  stagger: (index: number, base = 60) => index * base,
} as const;