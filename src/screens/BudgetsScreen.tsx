import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { MonthSelector } from '../components/MonthSelector';
import { BudgetCard } from '../components/BudgetCard';
import { Category, Budget } from '../@types';
import { formatCurrency, parseCurrencyInput } from '../utils/formatters';

export const BudgetsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    budgets,
    categories,
    selectedMonthYear,
    setSelectedMonthYear,
    getCategorySpentInMonth,
    setBudget,
    deleteBudget,
    getCategoryById,
  } = useFinance();

  // Modal para criar/editar orçamento
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [limitInput, setLimitInput] = useState('');
  const [editingBudgetId, setEditingBudgetId] = useState<string | null>(null);

  // Categorias de despesa disponíveis
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both' || !c.type);

  // Cálculos globais de orçamento
  const totalBudgeted = budgets.reduce((acc, b) => acc + b.limitAmount, 0);
  const totalSpentInBudgets = budgets.reduce((acc, b) => {
    return acc + getCategorySpentInMonth(b.categoryId, selectedMonthYear);
  }, 0);

  const openNewBudgetModal = () => {
    setEditingBudgetId(null);
    setLimitInput('');
    const unbudgetedCat = expenseCategories.find(c => !budgets.some(b => b.categoryId === c.id));
    setSelectedCategoryId(unbudgetedCat ? unbudgetedCat.id : expenseCategories[0]?.id || '');
    setModalVisible(true);
  };

  const openEditBudgetModal = (budget: Budget) => {
    setEditingBudgetId(budget.id);
    setSelectedCategoryId(budget.categoryId);
    setLimitInput(budget.limitAmount.toString().replace('.', ','));
    setModalVisible(true);
  };

  const handleSaveBudget = async () => {
    const numericAmount = parseCurrencyInput(limitInput);
    if (numericAmount <= 0) {
      Alert.alert('Valor Inválido', 'Por favor, informe um limite maior que zero.');
      return;
    }
    if (!selectedCategoryId) {
      Alert.alert('Categoria Obrigatória', 'Por favor, selecione uma categoria.');
      return;
    }

    await setBudget(selectedCategoryId, numericAmount);
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Planejamento & Metas</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Tetos de gastos por categoria
          </Text>
        </View>

        <View style={styles.addBudgetBtnWrapper}>
          <Pressable
            onPress={openNewBudgetModal}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
            style={[styles.addBudgetBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.addBudgetBtnText}>Novo Teto</Text>
          </Pressable>
        </View>
      </View>

      {/* Seletor de Mês */}
      <MonthSelector
        selectedMonthYear={selectedMonthYear}
        onMonthChange={setSelectedMonthYear}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Resumo Geral de Orçamentos */}
        {budgets.length > 0 && (
          <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.overviewHeader}>
              <Text style={[styles.overviewTitle, { color: colors.textSecondary }]}>
                Total Orçado no Mês
              </Text>
              <Text
                style={[
                  styles.overviewPercentage,
                  {
                    color:
                      totalSpentInBudgets > totalBudgeted
                        ? colors.expense
                        : totalSpentInBudgets >= totalBudgeted * 0.7
                        ? colors.warning
                        : colors.income,
                  },
                ]}
              >
                {totalBudgeted > 0 ? ((totalSpentInBudgets / totalBudgeted) * 100).toFixed(0) : 0}%
              </Text>
            </View>

            <View style={styles.overviewValues}>
              <Text style={[styles.overviewSpent, { color: colors.text }]}>
                {formatCurrency(totalSpentInBudgets)}{' '}
                <Text style={{ color: colors.textSecondary, fontSize: 14, fontWeight: '400' }}>
                  / {formatCurrency(totalBudgeted)}
                </Text>
              </Text>
            </View>
          </View>
        )}

        {/* Lista de Orçamentos */}
        {budgets.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="pie-chart-outline" size={46} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum limite definido</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Defina tetos de gastos para suas categorias (ex: R$ 500 para Lazer) e acompanhe o
              progresso visual.
            </Text>
            <View style={styles.emptyBtnWrapper}>
              <Pressable
                onPress={openNewBudgetModal}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
                style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.emptyBtnText}>Criar Primeiro Limite</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          budgets.map(b => {
            const category = getCategoryById(b.categoryId);
            const spent = getCategorySpentInMonth(b.categoryId, selectedMonthYear);
            return (
              <BudgetCard
                key={b.id}
                budget={b}
                category={category}
                spentAmount={spent}
                onEdit={() => openEditBudgetModal(b)}
                onDelete={() => deleteBudget(b.id)}
              />
            );
          })
        )}
      </ScrollView>

      {/* Modal de Criação / Edição de Orçamento */}
      <Modal visible={modalVisible} animationType="slide" transparent={true} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingBudgetId ? 'Editar Limite' : 'Novo Limite de Categoria'}
              </Text>
              <Pressable
                onPress={() => setModalVisible(false)}
                android_ripple={{ color: colors.primaryLight, borderless: true, radius: 18 }}
                style={{ padding: 4 }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
            </View>

            {/* Seleção de Categoria */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Selecione a Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {expenseCategories.map((cat: Category) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                    style={[
                      styles.categoryBadge,
                      {
                        backgroundColor: isSelected ? cat.color : colors.surface,
                        borderColor: isSelected ? cat.color : colors.border,
                      },
                    ]}
                  >
                    <Ionicons
                      name={cat.icon as any}
                      size={16}
                      color={isSelected ? '#FFF' : cat.color}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.categoryBadgeText, { color: isSelected ? '#FFF' : colors.text }]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* Input de Limite */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Teto Máximo Mensal (R$)</Text>
            <View style={[styles.inputRow, { backgroundColor: colors.inputBackground, borderColor: colors.border }]}>
              <Text style={[styles.currencyPrefix, { color: colors.primary }]}>R$</Text>
              <TextInput
                value={limitInput}
                onChangeText={setLimitInput}
                placeholder="500,00"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                style={[styles.inputField, { color: colors.text }]}
                autoFocus
              />
            </View>

            <View style={styles.saveBtnWrapper}>
              <Pressable
                onPress={handleSaveBudget}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveBtnText}>Salvar Limite</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addBudgetBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  addBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  addBudgetBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollBody: {
    paddingBottom: 30,
  },
  overviewCard: {
    marginHorizontal: 16,
    marginVertical: 10,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  overviewTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  overviewPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  overviewValues: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  overviewSpent: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  emptyCard: {
    margin: 20,
    padding: 32,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 1,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
  emptyBtnWrapper: {
    marginTop: 18,
    borderRadius: 16,
    overflow: 'hidden',
  },
  emptyBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 22,
    borderTopWidth: 1,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 6,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    marginRight: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  categoryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 54,
    marginBottom: 20,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  inputField: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
  },
  saveBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
