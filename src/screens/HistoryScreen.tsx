import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { MonthSelector } from '../components/MonthSelector';
import { TransactionCard } from '../components/TransactionCard';
import { Transaction } from '../@types';
import { formatCurrency } from '../utils/formatters';

type FilterTab = 'all' | 'expense' | 'income';

export const HistoryScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    filteredTransactions,
    selectedMonthYear,
    setSelectedMonthYear,
    getCategoryById,
    openEditTransactionModal,
    deleteTransaction,
    monthlyIncome,
    monthlyExpense,
  } = useFinance();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filtragem combinada: Tipo + Busca por texto
  const displayTransactions = useMemo(() => {
    return filteredTransactions.filter(t => {
      const matchesType =
        activeFilter === 'all' ? true : t.type === activeFilter;

      const category = getCategoryById(t.categoryId);
      const searchTarget = `${t.description} ${category?.name || ''}`.toLowerCase();
      const matchesSearch = searchQuery.trim() === '' || searchTarget.includes(searchQuery.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [filteredTransactions, activeFilter, searchQuery, getCategoryById]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Extrato de Movimentações</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Histórico detalhado por período
        </Text>
      </View>

      {/* Seletor de Mês Material Design 3 */}
      <MonthSelector
        selectedMonthYear={selectedMonthYear}
        onMonthChange={setSelectedMonthYear}
      />

      {/* Barra de Pesquisa */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search-outline" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Buscar por descrição ou categoria..."
          placeholderTextColor={colors.textSecondary}
          style={[styles.searchInput, { color: colors.text }]}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <Pressable
            onPress={() => setSearchQuery('')}
            android_ripple={{ color: colors.primaryLight, borderless: true, radius: 14 }}
            style={{ padding: 4 }}
          >
            <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      {/* Filtros em Abas MD3: Todos, Despesas, Receitas */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface }]}>
        <Pressable
          onPress={() => setActiveFilter('all')}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', borderless: false }}
          style={[
            styles.filterTab,
            activeFilter === 'all' && { backgroundColor: colors.card, elevation: 2 },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeFilter === 'all' ? colors.primary : colors.textSecondary },
            ]}
          >
            Todos ({filteredTransactions.length})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('expense')}
          android_ripple={{ color: 'rgba(239, 68, 68, 0.15)', borderless: false }}
          style={[
            styles.filterTab,
            activeFilter === 'expense' && { backgroundColor: colors.card, elevation: 2 },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeFilter === 'expense' ? colors.expense : colors.textSecondary },
            ]}
          >
            Despesas (-{formatCurrency(monthlyExpense)})
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveFilter('income')}
          android_ripple={{ color: 'rgba(16, 185, 129, 0.15)', borderless: false }}
          style={[
            styles.filterTab,
            activeFilter === 'income' && { backgroundColor: colors.card, elevation: 2 },
          ]}
        >
          <Text
            style={[
              styles.filterTabText,
              { color: activeFilter === 'income' ? colors.income : colors.textSecondary },
            ]}
          >
            Receitas (+{formatCurrency(monthlyIncome)})
          </Text>
        </Pressable>
      </View>

      {/* Lista de Transações */}
      <FlatList
        data={displayTransactions}
        keyExtractor={(item: Transaction) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const category = getCategoryById(item.categoryId);
          return (
            <TransactionCard
              transaction={item}
              category={category}
              onPress={() => openEditTransactionModal(item)}
              onDelete={() => deleteTransaction(item.id)}
            />
          );
        }}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="search" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Nenhum registro encontrado
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'Tente pesquisar por outro termo.'
                : 'Não há movimentações para o mês selecionado.'}
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filterBar: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 4,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 30,
  },
  emptyContainer: {
    margin: 20,
    padding: 32,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
});
