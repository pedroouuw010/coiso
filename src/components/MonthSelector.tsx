import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { MonthYear } from '../@types';
import { formatMonthYear, getPreviousMonth, getNextMonth } from '../utils/dateUtils';

interface MonthSelectorProps {
  selectedMonthYear: MonthYear;
  onMonthChange: (monthYear: MonthYear) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  selectedMonthYear,
  onMonthChange,
}) => {
  const { colors } = useTheme();

  const handlePrev = () => {
    onMonthChange(getPreviousMonth(selectedMonthYear));
  };

  const handleNext = () => {
    onMonthChange(getNextMonth(selectedMonthYear));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <TouchableOpacity
        onPress={handlePrev}
        style={[styles.arrowButton, { backgroundColor: colors.surface }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color={colors.text} />
      </TouchableOpacity>

      <View style={styles.monthDisplay}>
        <Ionicons name="calendar-outline" size={16} color={colors.primary} style={styles.calendarIcon} />
        <Text style={[styles.monthText, { color: colors.text }]}>
          {formatMonthYear(selectedMonthYear)}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleNext}
        style={[styles.arrowButton, { backgroundColor: colors.surface }]}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  arrowButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 6,
  },
  monthText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
