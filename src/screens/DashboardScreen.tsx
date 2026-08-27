import React, { useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { SummaryCard } from '../components/SummaryCard';
import { MonthSelector } from '../components/MonthSelector';
import { TransactionCard } from '../components/TransactionCard';
import { AlertBanner } from '../components/AlertBanner';
import { InsightCard } from '../components/InsightCard';

export const DashboardScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<any>();

  const {
    currentBalance,
    monthlyIncome,
    monthlyExpense,
    recentTransactions,
    selectedMonthYear,
    setSelectedMonthYear,
    getCategoryById,
    openEditTransactionModal,
    deleteTransaction,
    openAddTransactionModal,
    alerts,
    insights,
  } = useFinance();

  // Tratamento nativo do botão Voltar do Android
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Sair do Aplicativo', 'Deseja realmente fechar o Gastos?', [
        { text: 'Cancelar', onPress: () => null, style: 'cancel' },
        { text: 'Sair', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const rippleConfig = {
    color: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
    borderless: false,
  };

  const featureShortcuts = [
    { title: 'Assistente IA', icon: 'sparkles', route: 'Assistant', color: colors.primary },
    { title: 'Metas', icon: 'flag', route: 'Goals', color: colors.income },
    { title: 'Recorrentes', icon: 'repeat', route: 'Recurring', color: '#8B5CF6' },
    { title: 'Parcelas', icon: 'card', route: 'Installments', color: '#EC4899' },
    { title: 'Relatórios', icon: 'stats-chart', route: 'Reports', color: colors.warning },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              Gastos
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>Meu Painel</Text>
          </View>

          <View style={styles.headerButtonWrapper}>
            <Pressable
              onPress={() => navigation.navigate('Settings')}
              android_ripple={{ color: colors.primaryLight, borderless: true, radius: 24 }}
              style={[styles.headerIconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Ionicons name="settings-outline" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>

        {/* Alertas Ativos */}
        <AlertBanner alerts={alerts} />

        {/* Seletor de Mês */}
        <MonthSelector
          selectedMonthYear={selectedMonthYear}
          onMonthChange={setSelectedMonthYear}
        />

        {/* Resumo Financeiro */}
        <SummaryCard
          currentBalance={currentBalance}
          monthlyIncome={monthlyIncome}
          monthlyExpense={monthlyExpense}
        />

        {/* Atalhos para Funcionalidades */}
        <View style={styles.shortcutsRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shortcutsScroll}>
            {featureShortcuts.map((item, idx) => (
              <Pressable
                key={idx}
                onPress={() => navigation.navigate(item.route)}
                android_ripple={rippleConfig}
                style={[styles.shortcutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.shortcutIconWrap, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={20} color={item.color} />
                </View>
                <Text style={[styles.shortcutText, { color: colors.text }]}>{item.title}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Card de Insight em Destaque */}
        {insights.length > 0 && (
          <View style={styles.insightSection}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>💡 Insight do Momento</Text>
              <Pressable onPress={() => navigation.navigate('Reports')}>
                <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver relatórios</Text>
              </Pressable>
            </View>
            <InsightCard insight={insights[0]} />
          </View>
        )}

        {/* Transações Recentes */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Transações Recentes</Text>
          <Pressable
            onPress={() => navigation.navigate('History')}
            android_ripple={{ color: colors.primaryLight, borderless: true, radius: 20 }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={[styles.seeAllText, { color: colors.primary }]}>Ver extrato</Text>
          </Pressable>
        </View>

        {recentTransactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="file-tray-outline" size={44} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma movimentação</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Toque no botão [+] abaixo para cadastrar seu primeiro gasto ou ganho.
            </Text>
          </View>
        ) : (
          recentTransactions.map((transaction) => {
            const category = getCategoryById(transaction.categoryId);
            return (
              <TransactionCard
                key={transaction.id}
                transaction={transaction}
                category={category}
                onPress={() => openEditTransactionModal(transaction)}
                onDelete={() => deleteTransaction(transaction.id)}
              />
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 35,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  greetingText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
  },
  headerButtonWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  shortcutsRow: {
    marginVertical: 14,
  },
  shortcutsScroll: {
    gap: 10,
  },
  shortcutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
  },
  shortcutIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  shortcutText: {
    fontSize: 12,
    fontWeight: '700',
  },
  insightSection: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
  },
  emptyCard: {
    padding: 28,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
