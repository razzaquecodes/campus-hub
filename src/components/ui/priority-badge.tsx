import React from 'react';
import { Text, View } from 'react-native';

import { PriorityColors } from '@/constants/colors';
import type { Priority } from '@/types';

interface PriorityBadgeProps {
  priority: Priority;
}

const labels: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
};

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const color = PriorityColors[priority];

  return (
    <View
      className="flex-row items-center rounded-full px-2.5 py-1"
      style={{ backgroundColor: `${color}20` }}>
      <View className="mr-1.5 h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      <Text className="text-xs font-semibold" style={{ color }}>
        {labels[priority]}
      </Text>
    </View>
  );
}
