import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { CategoryBarChart, MonthlyComparisonBar } from '../components/MiniChart';
import { InsightCard } from '../components/InsightCard';
import { MonthSelector } from '../components/MonthSelector';
import { formatCurrencyBRL } from '../utils/formatters';
import { getMonthName, isDateInMonthYear } from '../utils/dateUtils';

export const ReportsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    transactions,
    categories,
    selectedMonthYear,
    setSelectedMonthYear,
    filteredTransactions,
    monthlyIncome,
    monthlyExpense,
    monthlyBalance,
    insights,
  } = useFinance();

  // Economia percentual
  const savingsPct = monthlyIncome > 0
    ? Math.max(0, Math.round((monthlyBalance / monthlyIncome) * 100))
    : 0;

  // Dados do mês anterior
  const prevMonthYear = useMemo(() => {
    return {
      month: selectedMonthYear.month === 0 ? 11 : selectedMonthYear.month - 1,
      year: selectedMonthYear.month === 0 ? selectedMonthYear.year - 1 : selectedMonthYear.year,
    };
  }, [selectedMonthYear]);

  const prevMonthTransactions = useMemo(() => {
    return transactions.filter((t) => isDateInMonthYear(t.date, prevMonthYear));
  }, [transactions, prevMonthYear]);

  const prevMonthlyIncome = useMemo(() => {
    return prevMonthTransactions.filter((t) => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  }, [prevMonthTransactions]);

  const prevMonthlyExpense = useMemo(() => {
    return prevMonthTransactions.filter((t) => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  }, [prevMonthTransactions]);

  // Variação percentual de despesas
  const expenseDiffPct = prevMonthlyExpense > 0
    ? ((monthlyExpense - prevMonthlyExpense) / prevMonthlyExpense) * 100
    : 0;

  // Gastos por categoria no mês atual
  const categoryData = useMemo(() => {
    const expenseTxs = filteredTransactions.filter((t) => t.type === 'expense');
    const map: Record<string, number> = {};

    expenseTxs.forEach((t) => {
      map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
    });

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || 'Outros',
          amount,
          color: cat?.color || colors.primary,
          percentage: monthlyExpense > 0 ? (amount / monthlyExpense) * 100 : 0,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [filteredTransactions, categories, monthlyExpense, colors.primary]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      {/* Seletor de Mês */}
      <MonthSelector
        selectedMonthYear={selectedMonthYear}
        onMonthChange={setSelectedMonthYear}
      />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* 1. Resumo da Economia */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Resumo Financeiro do Mês</Text>

          <View style={styles.metricsGrid}>
            <View style={[styles.metricBox, { backgroundColor: colors.incomeLight }]}>
              <Ionicons name="arrow-up-circle" size={20} color={colors.income} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Entradas</Text>
              <Text style={[styles.metricValue, { color: colors.income }]}>{formatCurrencyBRL(monthlyIncome)}</Text>
            </View>

            <View style={[styles.metricBox, { backgroundColor: colors.expenseLight }]}>
              <Ionicons name="arrow-down-circle" size={20} color={colors.expense} />
              <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Saídas</Text>
              <Text style={[styles.metricValue, { color: colors.expense }]}>{formatCurrencyBRL(monthlyExpense)}</Text>
            </View>
          </View>

          <View style={[styles.savingsBox, { backgroundColor: colors.inputBackground }]}>
            <View>
              <Text style={[styles.savingsLabel, { color: colors.textSecondary }]}>Economizado no Mês</Text>
              <Text style={[styles.savingsVal, { color: monthlyBalance >= 0 ? colors.income : colors.expense }]}>
                {formatCurrencyBRL(monthlyBalance)}
              </Text>
            </View>
            <View style={[styles.savingsBadge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.savingsBadgeText, { color: colors.primary }]}>{savingsPct}% guardado</Text>
            </View>
          </View>
        </View>

        {/* 2. Insights Automáticos */}
        {insights.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🧠 Insights Inteligentes</Text>
            {insights.map((ins, idx) => (
              <InsightCard key={idx} insight={ins} />
            ))}
          </View>
        )}

        {/* 3. Gastos por Categoria */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Distribuição por Categoria</Text>
          <CategoryBarChart data={categoryData} totalAmount={monthlyExpense} />
        </View>

        {/* 4. Comparação Mensal */}
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Comparação ({getMonthName(prevMonthYear.month)} × {getMonthName(selectedMonthYear.month)})
          </Text>

          {prevMonthlyExpense > 0 && (
            <View style={styles.comparisonHeader}>
              <Ionicons
                name={expenseDiffPct > 0 ? 'trending-up' : 'trending-down'}
                size={20}
                color={expenseDiffPct > 0 ? colors.expense : colors.income}
              />
              <Text style={[styles.comparisonText, { color: colors.text }]}>
                Gastos {expenseDiffPct > 0 ? 'aumentaram' : 'reduziram'}{' '}
                <Text style={{ fontWeight: 'bold', color: expenseDiffPct > 0 ? colors.expense : colors.income }}>
                  {Math.abs(expenseDiffPct).toFixed(1)}%
                </Text>{' '}
                em relação ao mês passado.
              </Text>
            </View>
          )}

          <MonthlyComparisonBar
            currentMonth={getMonthName(selectedMonthYear.month).substring(0, 3)}
            currentExpense={monthlyExpense}
            prevMonth={getMonthName(prevMonthYear.month).substring(0, 3)}
            prevExpense={prevMonthlyExpense}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  card: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 14,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  metricBox: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
  },
  metricLabel: {
    fontSize: 11,
    marginTop: 4,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  savingsBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
  },
  savingsLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  savingsVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  savingsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  savingsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    paddingLeft: 4,
  },
  comparisonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  comparisonText: {
    fontSize: 13,
    flex: 1,
  },
});
