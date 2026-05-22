import React from 'react';
import { Text, type TextProps } from 'react-native';

import { Theme } from '@/constants/theme';

type Variant = 'hero' | 'title' | 'subtitle' | 'body' | 'caption' | 'micro';

interface OsTextProps extends TextProps {
  variant?: Variant;
  muted?: boolean;
  accent?: boolean;
}

export function OsText({
  variant = 'body',
  muted,
  accent,
  style,
  children,
  ...props
}: OsTextProps) {
  const typo = Theme.typography[variant];
  const color = accent
    ? Theme.colors.primaryLight
    : muted
      ? Theme.colors.textTertiary
      : Theme.colors.textPrimary;

  return (
    <Text style={[{ color, ...typo }, style]} {...props}>
      {children}
    </Text>
  );
}
