import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { formatCurrencyBRL } from '../utils/formatters';
import { getMonthName } from '../utils/dateUtils';

export const InstallmentsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { transactions, installmentGroups, getCategoryById, openAddTransactionModal } = useFinance();

  const [activeTab, setActiveTab] = useState<'purchases' | 'futureMonths'>('purchases');

  // Todas as transações parceladas
  const installmentTxs = useMemo(() => {
    return transactions.filter((t) => !!t.installmentGroupId);
  }, [transactions]);

  // Grupos com progresso
  const groupsWithDetails = useMemo(() => {
    return installmentGroups.map((group) => {
      const groupTxs = transactions.filter((t) => t.installmentGroupId === group.id);
      const now = new Date();
      
      // Consideramos pagas as parcelas cuja data seja <= agora
      const paidTxs = groupTxs.filter((t) => new Date(t.date) <= now);
      const paidCount = Math.min(paidTxs.length, group.installmentCount);
      const remainingCount = Math.max(0, group.installmentCount - paidCount);
      const installmentVal = group.totalAmount / group.installmentCount;
      const remainingAmount = remainingCount * installmentVal;

      return {
        ...group,
        paidCount,
        remainingCount,
        installmentVal,
        remainingAmount,
        category: getCategoryById(group.categoryId),
      };
    });
  }, [installmentGroups, transactions, getCategoryById]);

  // Parcelas futuras agrupadas por mês
  const futureMonthsGrouped = useMemo(() => {
    const map: Record<string, { label: string; date: Date; total: number; count: number }> = {};
    const now = new Date();
    // Início do mês atual
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    installmentTxs.forEach((t) => {
      const d = new Date(t.date);
      if (d >= startOfCurrentMonth) {
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        const monthLabel = `${getMonthName(d.getMonth())} ${d.getFullYear()}`;
        if (!map[key]) {
          map[key] = { label: monthLabel, date: d, total: 0, count: 0 };
        }
        map[key].total += t.amount;
        map[key].count += 1;
      }
    });

    return Object.values(map).sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [installmentTxs]);

  const totalRemainingAll = groupsWithDetails.reduce((acc, g) => acc + g.remainingAmount, 0);

  const ripple = { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: false };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Card Resumo */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total Restante em Parcelas</Text>
          <Text style={[styles.overviewAmount, { color: colors.expense }]}>{formatCurrencyBRL(totalRemainingAll)}</Text>
          <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
            {groupsWithDetails.length} compras parceladas ativas
          </Text>
        </View>

        {/* Alternador de visualização */}
        <View style={[styles.tabBar, { backgroundColor: colors.inputBackground }]}>
          <Pressable
            onPress={() => setActiveTab('purchases')}
            style={[
              styles.tabBtn,
              activeTab === 'purchases' && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'purchases' ? colors.primary : colors.textSecondary },
              ]}
            >
              Compras Parceladas
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab('futureMonths')}
            style={[
              styles.tabBtn,
              activeTab === 'futureMonths' && { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text
              style={[
                styles.tabText,
                { color: activeTab === 'futureMonths' ? colors.primary : colors.textSecondary },
              ]}
            >
              Compromissos por Mês
            </Text>
          </Pressable>
        </View>

        {/* Conteúdo Aba 1: Compras Parceladas */}
        {activeTab === 'purchases' && (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Compras Parceladas</Text>
              <Pressable
                onPress={openAddTransactionModal}
                android_ripple={ripple}
                style={[styles.addBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.addBtnText}>Nova Parcela</Text>
              </Pressable>
            </View>

            {groupsWithDetails.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Ionicons name="card-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma compra parcelada</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Ao adicionar uma nova despesa no botão [+], marque a opção "Parcelado" para acompanhar aqui.
                </Text>
              </View>
            ) : (
              groupsWithDetails.map((group) => {
                const progress = group.installmentCount > 0 ? group.paidCount / group.installmentCount : 0;
                const pct = Math.round(progress * 100);

                return (
                  <View
                    key={group.id}
                    style={[styles.purchaseCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.purchaseTop}>
                      <View style={[styles.iconBox, { backgroundColor: (group.category?.color || colors.primary) + '20' }]}>
                        <Ionicons name={(group.category?.icon || 'card') as any} size={22} color={group.category?.color || colors.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.purchaseName, { color: colors.text }]}>{group.description}</Text>
                        <Text style={[styles.purchaseCat, { color: colors.textSecondary }]}>
                          {group.category?.name || 'Geral'} • {group.installmentCount}x de {formatCurrencyBRL(group.installmentVal)}
                        </Text>
                      </View>
                      <Text style={[styles.purchaseTotal, { color: colors.text }]}>{formatCurrencyBRL(group.totalAmount)}</Text>
                    </View>

                    {/* Progresso de parcelas */}
                    <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: colors.primary }]} />
                    </View>

                    <View style={styles.purchaseBottom}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>
                        {group.paidCount}/{group.installmentCount} parcelas pagas
                      </Text>
                      <Text style={[styles.remainingText, { color: colors.expense }]}>
                        Faltam {group.remainingCount}x ({formatCurrencyBRL(group.remainingAmount)})
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* Conteúdo Aba 2: Parcelas Futuras por Mês */}
        {activeTab === 'futureMonths' && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
              Previsão de Parcelas Futuras
            </Text>

            {futureMonthsGrouped.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: colors.border }]}>
                <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Sem parcelas futuras</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Suas parcelas dos próximos meses aparecerão listadas e somadas automaticamente aqui.
                </Text>
              </View>
            ) : (
              futureMonthsGrouped.map((monthItem, idx) => (
                <View
                  key={idx}
                  style={[styles.monthCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.monthLeft}>
                    <View style={[styles.calendarIcon, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="calendar" size={20} color={colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.monthLabel, { color: colors.text }]}>{monthItem.label}</Text>
                      <Text style={[styles.monthSub, { color: colors.textSecondary }]}>
                        {monthItem.count} parcela(s) neste mês
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.monthTotal, { color: colors.expense }]}>
                    {formatCurrencyBRL(monthItem.total)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { padding: 16, paddingBottom: 40 },
  overviewCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
  },
  overviewLabel: { fontSize: 12, marginBottom: 4 },
  overviewAmount: { fontSize: 26, fontWeight: 'bold', marginVertical: 2 },
  overviewSub: { fontSize: 12, marginTop: 4 },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: 'bold' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 12 },
  purchaseCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  purchaseTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  purchaseName: { fontSize: 15, fontWeight: '700' },
  purchaseCat: { fontSize: 12, marginTop: 2 },
  purchaseTotal: { fontSize: 16, fontWeight: 'bold' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginVertical: 10 },
  barFill: { height: 8, borderRadius: 4 },
  purchaseBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeText: { fontSize: 12, fontWeight: '600' },
  remainingText: { fontSize: 12, fontWeight: '700' },
  monthCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    elevation: 1,
  },
  monthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  monthLabel: { fontSize: 15, fontWeight: '700' },
  monthSub: { fontSize: 12, marginTop: 2 },
  monthTotal: { fontSize: 16, fontWeight: 'bold' },
  emptyBox: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 12 },
  emptySubtitle: { fontSize: 13, textAlign: 'center', marginTop: 6, lineHeight: 18 },
});
