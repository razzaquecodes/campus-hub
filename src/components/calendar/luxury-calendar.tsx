import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { GlassPanel } from '@/components/ui/glass-panel';
import { Theme } from '@/constants/theme';
import { getDaysInMonth, getFirstDayOfMonth } from '@/lib/utils';
import type { Holiday } from '@/types';

interface CalendarProps {
  year: number;
  month: number;
  holidays: Holiday[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function LuxuryCalendar({
  year,
  month,
  holidays,
  selectedDate,
  onSelectDate,
  onChangeMonth,
}: CalendarProps) {
  const slideX = useSharedValue(0);

  const holidayDates = useMemo(
    () => new Set(holidays.map((h) => h.date)),
    [holidays],
  );

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: slideX.value }],
    opacity: withTiming(slideX.value === 0 ? 1 : 0.7, { duration: 200 }),
  }));

  const goToPrev = () => {
    slideX.value = withTiming(20, { duration: 150 }, () => {
      slideX.value = 0;
    });
    if (month === 0) onChangeMonth(year - 1, 11);
    else onChangeMonth(year, month - 1);
  };

  const goToNext = () => {
    slideX.value = withTiming(-20, { duration: 150 }, () => {
      slideX.value = 0;
    });
    if (month === 11) onChangeMonth(year + 1, 0);
    else onChangeMonth(year, month + 1);
  };

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const today = new Date();
  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const dateStr = (day: number) =>
    `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  return (
    <GlassPanel noPadding>
      <View className="p-4">
        <View className="mb-5 flex-row items-center justify-between">
          <Pressable onPress={goToPrev} className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated">
            <Text className="text-lg text-text-secondary">‹</Text>
          </Pressable>
          <Text className="text-lg font-bold text-text-primary">
            {MONTHS[month]} {year}
          </Text>
          <Pressable onPress={goToNext} className="h-9 w-9 items-center justify-center rounded-xl bg-surface-elevated">
            <Text className="text-lg text-text-secondary">›</Text>
          </Pressable>
        </View>

        <View className="mb-2 flex-row">
          {WEEKDAYS.map((d) => (
            <View key={d} className="flex-1 items-center py-2">
              <Text className="text-xs font-medium text-text-tertiary">{d}</Text>
            </View>
          ))}
        </View>

        <Animated.View style={animatedStyle}>
          <View className="flex-row flex-wrap">
            {days.map((day, i) => {
              if (day === null) {
                return <View key={`empty-${i}`} className="w-[14.28%] aspect-square" />;
              }

              const ds = dateStr(day);
              const hasEvent = holidayDates.has(ds);
              const selected = selectedDate === ds;
              const todayMark = isToday(day);

              return (
                <Pressable
                  key={ds}
                  onPress={() => onSelectDate(ds)}
                  className="w-[14.28%] items-center justify-center aspect-square">
                  <View
                    className="h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: selected
                        ? Theme.colors.primary
                        : todayMark
                          ? `${Theme.colors.primary}25`
                          : 'transparent',
                    }}>
                    <Text
                      style={{
                        fontSize: 14,
                        fontWeight: '500',
                        color: selected
                          ? '#fff'
                          : todayMark
                            ? Theme.colors.primaryLight
                            : Theme.colors.textSecondary,
                      }}>
                      {day}
                    </Text>
                    {hasEvent ? (
                      <View
                        className="absolute bottom-1 h-1 w-1 rounded-full"
                        style={{ backgroundColor: selected ? '#fff' : Theme.colors.accent }}
                      />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </GlassPanel>
  );
}

interface HolidayEventCardProps {
  holiday: Holiday;
}

const TYPE_COLORS: Record<Holiday['type'], string> = {
  holiday: Theme.colors.success,
  exam: Theme.colors.danger,
  event: Theme.colors.accent,
};

export function HolidayEventCard({ holiday }: HolidayEventCardProps) {
  const color = TYPE_COLORS[holiday.type];

  return (
    <View className="mb-2 flex-row items-center rounded-2xl border border-border bg-surface p-4">
      <View className="mr-3 h-10 w-1 rounded-full" style={{ backgroundColor: color }} />
      <View className="flex-1">
        <Text className="text-base font-semibold text-text-primary">{holiday.title}</Text>
        {holiday.description ? (
          <Text className="mt-0.5 text-sm text-text-secondary">{holiday.description}</Text>
        ) : null}
      </View>
      <Text className="text-xs font-medium text-text-tertiary">
        {new Date(holiday.date + 'T00:00:00').toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </Text>
    </View>
  );
}
