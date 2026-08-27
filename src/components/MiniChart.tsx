import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrencyBRL } from '../utils/formatters';

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  color: string;
  percentage: number;
}

interface MiniChartProps {
  data: CategoryData[];
  totalAmount: number;
}

export const CategoryBarChart: React.FC<MiniChartProps> = ({ data, totalAmount }) => {
  const { colors } = useTheme();

  if (!data || data.length === 0 || totalAmount === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Nenhum gasto registrado no período
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Barra de distribuição horizontal unificada */}
      <View style={[styles.unifiedBar, { backgroundColor: colors.border }]}>
        {data.map((item) => (
          <View
            key={item.id}
            style={{
              width: `${item.percentage}%` as any,
              backgroundColor: item.color,
              height: '100%',
            }}
          />
        ))}
      </View>

      {/* Lista detalhada das categorias */}
      <View style={styles.itemsList}>
        {data.map((item) => (
          <View key={item.id} style={styles.itemRow}>
            <View style={styles.itemLeft}>
              <View style={[styles.colorDot, { backgroundColor: item.color }]} />
              <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={1}>
                {item.name}
              </Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={[styles.itemPct, { color: colors.textSecondary }]}>
                {item.percentage.toFixed(1)}%
              </Text>
              <Text style={[styles.itemAmount, { color: colors.text }]}>
                {formatCurrencyBRL(item.amount)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

interface MonthlyComparisonProps {
  currentMonth: string;
  currentExpense: number;
  prevMonth: string;
  prevExpense: number;
}

export const MonthlyComparisonBar: React.FC<MonthlyComparisonProps> = ({
  currentMonth,
  currentExpense,
  prevMonth,
  prevExpense,
}) => {
  const { colors } = useTheme();
  const max = Math.max(currentExpense, prevExpense, 1);
  const currentHeight = Math.max((currentExpense / max) * 120, 10);
  const prevHeight = Math.max((prevExpense / max) * 120, 10);

  return (
    <View style={styles.compContainer}>
      <View style={styles.barGroup}>
        <Text style={[styles.barValueText, { color: colors.textSecondary }]}>
          {formatCurrencyBRL(prevExpense)}
        </Text>
        <View
          style={[
            styles.verticalBar,
            { height: prevHeight, backgroundColor: colors.textSecondary + '60' },
          ]}
        />
        <Text style={[styles.barLabel, { color: colors.textSecondary }]}>{prevMonth}</Text>
      </View>

      <View style={styles.barGroup}>
        <Text style={[styles.barValueText, { color: colors.expense }]}>
          {formatCurrencyBRL(currentExpense)}
        </Text>
        <View
          style={[
            styles.verticalBar,
            { height: currentHeight, backgroundColor: colors.primary },
          ]}
        />
        <Text style={[styles.barLabel, { color: colors.text }]}>{currentMonth}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  emptyWrap: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
  },
  unifiedBar: {
    height: 12,
    borderRadius: 6,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 16,
  },
  itemsList: {
    gap: 10,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  itemPct: {
    fontSize: 12,
    width: 44,
    textAlign: 'right',
  },
  itemAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  compContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    paddingTop: 10,
  },
  barGroup: {
    alignItems: 'center',
    width: 100,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 6,
  },
  verticalBar: {
    width: 38,
    borderRadius: 8,
  },
  barLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 8,
  },
});
