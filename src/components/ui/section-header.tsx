import React from 'react';
import { Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function SectionHeader({ title, subtitle, action, onAction, style }: SectionHeaderProps) {
  return (
    <View className="mb-4 flex-row items-end justify-between" style={style}>
      <View>
        <Text className="text-xl font-bold tracking-tight text-text-primary">{title}</Text>
        {subtitle ? (
          <Text className="mt-0.5 text-sm text-text-secondary">{subtitle}</Text>
        ) : null}
      </View>
      {action ? (
        onAction ? (
          <Pressable onPress={onAction}>
            {typeof action === 'string' ? (
              <Text className="text-sm font-semibold text-primary">{action}</Text>
            ) : (
              action
            )}
          </Pressable>
        ) : (
          <>{action}</>
        )
      ) : null}
    </View>
  );
}
