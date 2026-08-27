import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/formatters';

interface SummaryCardProps {
  currentBalance: number;
  monthlyIncome: number;
  monthlyExpense: number;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  currentBalance,
  monthlyIncome,
  monthlyExpense,
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Saldo Principal Material 3 */}
      <View style={styles.balanceHeader}>
        <View>
          <Text style={[styles.balanceLabel, { color: colors.textSecondary }]}>Saldo Geral</Text>
          <Text
            style={[
              styles.balanceValue,
              { color: currentBalance >= 0 ? colors.income : colors.expense },
            ]}
          >
            {formatCurrency(currentBalance)}
          </Text>
        </View>
        <View
          style={[
            styles.balanceBadge,
            { backgroundColor: currentBalance >= 0 ? colors.incomeLight : colors.expenseLight },
          ]}
        >
          <Ionicons
            name={currentBalance >= 0 ? 'wallet-outline' : 'alert-circle-outline'}
            size={24}
            color={currentBalance >= 0 ? colors.income : colors.expense}
          />
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      {/* Entradas e Saídas do Mês */}
      <View style={styles.row}>
        {/* Entradas */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.incomeLight }]}>
              <Ionicons name="arrow-down-circle" size={20} color={colors.income} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Entradas</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.income }]}>
            +{formatCurrency(monthlyIncome)}
          </Text>
        </View>

        <View style={[styles.verticalDivider, { backgroundColor: colors.border }]} />

        {/* Saídas */}
        <View style={styles.statItem}>
          <View style={styles.statIconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: colors.expenseLight }]}>
              <Ionicons name="arrow-up-circle" size={20} color={colors.expense} />
            </View>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saídas</Text>
          </View>
          <Text style={[styles.statValue, { color: colors.expense }]}>
            -{formatCurrency(monthlyExpense)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    marginHorizontal: 16,
    marginVertical: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  balanceBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  verticalDivider: {
    width: 1,
    height: 36,
    marginHorizontal: 12,
  },
});
