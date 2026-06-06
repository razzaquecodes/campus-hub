/**
 * CampusHub — Logo Components
 * Modern digital evolution of the BBIT globe identity
 *
 * Variants:
 *   <OrbLogo>        — animated glyph (app icon / splash hero)
 *   <BBITWordmark>   — textual wordmark with globe sub-glyph
 *   <CampusHubLogo>  — combined lockup for login / headers
 *   <AppIconLogo>    — static icon for iOS/Android export
 */

import React from 'react';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Line,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
  ClipPath,
  G,
} from 'react-native-svg';
import { Colors } from './brand.tokens';

// ─── OrbLogo ─────────────────────────────────────────────────────────────────
// The premium digital globe — hero of the brand identity
// Inspired by BBIT's globe but fully redrawn for digital media
export function OrbLogo({ size = 120 }: { size?: number }) {
  const cx = size / 2, cy = size / 2;
  const R  = size * 0.44;   // globe radius

  // Latitude ellipses (5 bands)
  const bands = [-0.68, -0.36, 0, 0.36, 0.68];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        {/* Background fill */}
        <RadialGradient id="orbBg" cx="50%" cy="38%" r="62%">
          <Stop offset="0%"   stopColor="#1A3A6C" />
          <Stop offset="55%"  stopColor="#0B1E44" />
          <Stop offset="100%" stopColor="#060E20" />
        </RadialGradient>

        {/* Globe face gradient — light source top-left */}
        <RadialGradient id="globeFace" cx="35%" cy="30%" r="70%">
          <Stop offset="0%"   stopColor="#2563EB" stopOpacity="1" />
          <Stop offset="40%"  stopColor="#1D4ED8" stopOpacity="1" />
          <Stop offset="100%" stopColor="#0B1A35" stopOpacity="1" />
        </RadialGradient>

        {/* Outer ring shimmer */}
        <LinearGradient id="ringShim" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%"   stopColor="#60A5FA" stopOpacity="0.9" />
          <Stop offset="40%"  stopColor="#3B82F6" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#1D4ED8" stopOpacity="0.2" />
        </LinearGradient>

        {/* Orbital ring gradient */}
        <LinearGradient id="orbitGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%"   stopColor="#93C5FD" stopOpacity="0.1" />
          <Stop offset="50%"  stopColor="#60A5FA" stopOpacity="0.9" />
          <Stop offset="100%" stopColor="#93C5FD" stopOpacity="0.1" />
        </LinearGradient>

        {/* Specular highlight */}
        <RadialGradient id="spec" cx="30%" cy="25%" r="40%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity="0.18" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>

        <ClipPath id="globeClip">
          <Circle cx={cx} cy={cy} r={R} />
        </ClipPath>
      </Defs>

      {/* ── Outer halo ── */}
      <Circle cx={cx} cy={cy} r={R + size * 0.08}
        fill="none" stroke="#3B82F6" strokeWidth={size * 0.006} strokeOpacity="0.12" />
      <Circle cx={cx} cy={cy} r={R + size * 0.04}
        fill="none" stroke="#3B82F6" strokeWidth={size * 0.009} strokeOpacity="0.22" />

      {/* ── Globe background ── */}
      <Circle cx={cx} cy={cy} r={R} fill="url(#orbBg)" />
      <Circle cx={cx} cy={cy} r={R} fill="url(#globeFace)" />

      {/* ── Latitude bands ── */}
      <G clipPath="url(#globeClip)">
        {bands.map((t, i) => {
          const ly  = cy + t * R;
          const hw  = Math.sqrt(Math.max(0, R * R - (t * R) ** 2));
          const ry  = hw * 0.19;
          const op  = i === 2 ? 0.85 : i === 1 || i === 3 ? 0.5 : 0.3;
          const sw  = i === 2 ? size * 0.008 : size * 0.005;
          return (
            <Ellipse key={i} cx={cx} cy={ly} rx={hw} ry={ry}
              fill="none" stroke={Colors.orb400} strokeWidth={sw} opacity={op} />
          );
        })}

        {/* ── Prime meridian ── */}
        <Line x1={cx} y1={cy - R} x2={cx} y2={cy + R}
          stroke={Colors.orb400} strokeWidth={size * 0.008} opacity="0.55" />

        {/* ── Secondary meridian (tilted) ── */}
        <Ellipse cx={cx} cy={cy} rx={R * 0.45} ry={R}
          fill="none" stroke={Colors.orb400}
          strokeWidth={size * 0.006} opacity="0.35" />

        {/* ── Specular highlight ── */}
        <Circle cx={cx} cy={cy} r={R} fill="url(#spec)" />
      </G>

      {/* ── Orbital ring (inclined) ── */}
      <Ellipse cx={cx} cy={cy}
        rx={R * 1.36} ry={R * 0.38}
        fill="none" stroke="url(#orbitGrad)"
        strokeWidth={size * 0.018}
        transform={`rotate(-20 ${cx} ${cy})`} />

      {/* ── Orbital dot (satellite) ── */}
      {(() => {
        const orbitRx = R * 1.36, orbitRy = R * 0.38;
        const dotDeg  = 40;  // position on orbit
        const rad = (dotDeg * Math.PI) / 180;
        const dx  = orbitRx * Math.cos(rad);
        const dy  = orbitRy * Math.sin(rad);
        // rotate by -20deg
        const a2 = (-20 * Math.PI) / 180;
        const nx = cx + dx * Math.cos(a2) - dy * Math.sin(a2);
        const ny = cy + dx * Math.sin(a2) + dy * Math.cos(a2);
        return (
          <>
            <Circle cx={nx} cy={ny} r={size * 0.028}
              fill={Colors.orb400} opacity="0.9" />
            <Circle cx={nx} cy={ny} r={size * 0.018}
              fill={Colors.white} opacity="0.95" />
          </>
        );
      })()}

      {/* ── Graduation cap (BBIT academic identity) ── */}
      {(() => {
        const capW = R * 0.55;
        const capH = R * 0.14;
        const capY = cy - R * 0.05;
        const stemH = R * 0.26;
        const boardW = R * 0.90;
        const boardH = R * 0.28;
        const by = capY - capH / 2 - boardH;
        return (
          <>
            {/* Board (mortarboard top) */}
            <Path
              d={`M ${cx} ${by + boardH * 0.1} L ${cx + boardW/2} ${by + boardH*0.55} L ${cx} ${by + boardH} L ${cx - boardW/2} ${by + boardH*0.55} Z`}
              fill={Colors.white} opacity="0.92"
            />
            {/* Cap band */}
            <Rect x={cx - capW/2} y={capY - capH/2} width={capW} height={capH}
              rx={capH * 0.25} fill={Colors.white} opacity="0.85" />
            {/* Tassel stem */}
            <Line x1={cx + capW*0.48} y1={capY}
                  x2={cx + capW*0.48} y2={capY + stemH}
              stroke={Colors.orb300} strokeWidth={size * 0.012} opacity="0.8"
              strokeLinecap="round" />
            {/* Tassel ball */}
            <Circle cx={cx + capW*0.48} cy={capY + stemH + size*0.013}
              r={size * 0.016} fill={Colors.orb300} opacity="0.9" />
          </>
        );
      })()}

      {/* ── Outer ring with shimmer ── */}
      <Circle cx={cx} cy={cy} r={R + size * 0.04}
        fill="none" stroke="url(#ringShim)" strokeWidth={size * 0.004} />
    </Svg>
  );
}

// ─── AppIconLogo ──────────────────────────────────────────────────────────────
// Rounded square icon — iOS / Android home screen
export function AppIconLogo({ size = 120 }: { size?: number }) {
  const pad  = size * 0.11;
  const inner = size - pad * 2;
  const cx   = size / 2, cy = size / 2;
  const R    = inner * 0.40;
  const bands = [-0.66, -0.34, 0, 0.34, 0.66];

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <LinearGradient id="iconBg" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%"   stopColor="#0B1E44" />
          <Stop offset="100%" stopColor="#030912" />
        </LinearGradient>
        <RadialGradient id="iconGlobe" cx="35%" cy="30%" r="70%">
          <Stop offset="0%"   stopColor="#2563EB" />
          <Stop offset="100%" stopColor="#0B1A35" />
        </RadialGradient>
        <RadialGradient id="iconGlow" cx="50%" cy="50%" r="50%">
          <Stop offset="0%"   stopColor="#3B82F6" stopOpacity="0.25" />
          <Stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
        </RadialGradient>
        <ClipPath id="iconClip">
          <Circle cx={cx} cy={cy} r={R} />
        </ClipPath>
      </Defs>

      {/* Rounded square bg */}
      <Rect x={0} y={0} width={size} height={size}
        rx={size * 0.22} ry={size * 0.22} fill="url(#iconBg)" />

      {/* Ambient glow */}
      <Circle cx={cx} cy={cy} r={R * 1.8} fill="url(#iconGlow)" />

      {/* Ring */}
      <Circle cx={cx} cy={cy} r={R + size * 0.04}
        fill="none" stroke="#3B82F6" strokeWidth={size * 0.012} strokeOpacity="0.35" />

      {/* Globe */}
      <Circle cx={cx} cy={cy} r={R} fill="url(#iconGlobe)" />
      <G clipPath="url(#iconClip)">
        {bands.map((t, i) => {
          const ly = cy + t * R;
          const hw = Math.sqrt(Math.max(0, R * R - (t * R) ** 2));
          return <Ellipse key={i} cx={cx} cy={ly} rx={hw} ry={hw * 0.18}
            fill="none" stroke="#60A5FA"
            strokeWidth={size * (i === 2 ? 0.009 : 0.006)}
            opacity={i === 2 ? 0.9 : 0.45} />;
        })}
        <Line x1={cx} y1={cy - R} x2={cx} y2={cy + R}
          stroke="#60A5FA" strokeWidth={size * 0.009} opacity="0.55" />
      </G>

      {/* Orbital ring */}
      <Ellipse cx={cx} cy={cy} rx={R * 1.32} ry={R * 0.35}
        fill="none" stroke="#93C5FD" strokeWidth={size * 0.02}
        transform={`rotate(-18 ${cx} ${cy})`} opacity="0.85" />

      {/* Cap */}
      <Path
        d={`M ${cx} ${cy - R * 0.55} L ${cx + R*0.45} ${cy - R*0.1} L ${cx} ${cy + R*0.3} L ${cx - R*0.45} ${cy - R*0.1} Z`}
        fill="white" opacity="0.92" />
    </Svg>
  );
}

// ─── BBITWordmark ─────────────────────────────────────────────────────────────
// Refined wordmark: BBIT in tracked capitals + tiny globe glyph
export function BBITWordmark({ size = 32 }: { size?: number }) {
  const gs = size * 0.55;   // globe sub-glyph size
  const totalW = gs + size * 0.3 + size * 2.6;  // glyph + gap + text

  return (
    <Svg width={totalW} height={size} viewBox={`0 0 ${totalW} ${size}`}>
      <Defs>
        <RadialGradient id="wmGlobe" cx="35%" cy="30%" r="70%">
          <Stop offset="0%"   stopColor="#2563EB" />
          <Stop offset="100%" stopColor="#0B1A35" />
        </RadialGradient>
        <LinearGradient id="wmText" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%"   stopColor="#F1F5F9" />
          <Stop offset="100%" stopColor="#93C5FD" />
        </LinearGradient>
      </Defs>

      {/* Mini globe glyph */}
      <G transform={`translate(0, ${(size - gs) / 2})`}>
        <Circle cx={gs/2} cy={gs/2} r={gs/2} fill="url(#wmGlobe)" />
        <Circle cx={gs/2} cy={gs/2} r={gs/2}
          fill="none" stroke="#60A5FA" strokeWidth={gs * 0.06} />
        {[-0.5, 0, 0.5].map((t, i) => {
          const ly = gs/2 + t * gs/2;
          const hw = Math.sqrt(Math.max(0, (gs/2)**2 - (t * gs/2)**2));
          return <Ellipse key={i} cx={gs/2} cy={ly} rx={hw} ry={hw * 0.22}
            fill="none" stroke="#60A5FA"
            strokeWidth={gs * (i === 1 ? 0.06 : 0.04)}
            opacity={i === 1 ? 0.9 : 0.45} />;
        })}
        <Line x1={gs/2} y1={0} x2={gs/2} y2={gs}
          stroke="#60A5FA" strokeWidth={gs * 0.05} opacity="0.5" />
        <Ellipse cx={gs/2} cy={gs/2} rx={gs * 0.68} ry={gs * 0.22}
          fill="none" stroke="#93C5FD" strokeWidth={gs * 0.075}
          transform={`rotate(-18 ${gs/2} ${gs/2})`} />
      </G>

      {/* BBIT text */}
      <SvgText
        x={gs + size * 0.3}
        y={size * 0.75}
        fontSize={size * 0.72}
        fontWeight="800"
        fill="url(#wmText)"
        letterSpacing={size * 0.08}
        fontFamily="System"
      >
        BBIT
      </SvgText>
    </Svg>
  );
}

// ─── CampusHubLockup ─────────────────────────────────────────────────────────
// Full brand lockup: orb + stacked text
export function CampusHubLockup({
  orbSize = 88,
}: {
  orbSize?: number;
}) {
  // Rendered in React Native — wrap in View externally
  // Returns only the SVG mark; pair with RN Text for app name
  return <OrbLogo size={orbSize} />;
}
