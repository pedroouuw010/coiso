import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionType, Category } from '../@types';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { getTodayDateString } from '../utils/dateUtils';
import { parseCurrencyInput, formatCurrencyBRL } from '../utils/formatters';

export const TransactionModal: React.FC = () => {
  const { colors, isDark } = useTheme();
  const {
    isTransactionModalVisible,
    closeTransactionModal,
    editingTransaction,
    addTransaction,
    addInstallmentTransaction,
    updateTransaction,
    categories,
  } = useFinance();

  const [type, setType] = useState<TransactionType>('expense');
  const [paymentMode, setPaymentMode] = useState<'single' | 'installment'>('single');
  const [installmentCount, setInstallmentCount] = useState('12');
  const [amountStr, setAmountStr] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [date, setDate] = useState(getTodayDateString());

  // Categorias filtradas pelo tipo selecionado
  const availableCategories = categories.filter(
    c => c.type === 'both' || c.type === type || !c.type
  );

  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setPaymentMode('single');
      setAmountStr(editingTransaction.amount.toString().replace('.', ','));
      setDescription(editingTransaction.description || '');
      setCategoryId(editingTransaction.categoryId);
      setDate(editingTransaction.date);
    } else {
      setType('expense');
      setPaymentMode('single');
      setInstallmentCount('12');
      setAmountStr('');
      setDescription('');
      setDate(getTodayDateString());
      const firstCat = availableCategories[0]?.id || '';
      setCategoryId(firstCat);
    }
  }, [editingTransaction, isTransactionModalVisible]);

  useEffect(() => {
    const isCatValid = availableCategories.some(c => c.id === categoryId);
    if (!isCatValid && availableCategories.length > 0) {
      setCategoryId(availableCategories[0].id);
    }
  }, [type]);

  const handleSave = async () => {
    const numericAmount = parseCurrencyInput(amountStr);

    if (numericAmount <= 0) {
      Alert.alert('Valor Inválido', 'Por favor, informe um valor maior que zero.');
      return;
    }

    if (!categoryId) {
      Alert.alert('Categoria Necessária', 'Por favor, selecione uma categoria.');
      return;
    }

    if (editingTransaction) {
      await updateTransaction({
        ...editingTransaction,
        amount: numericAmount,
        type,
        categoryId,
        description: description.trim(),
        date: date.trim() || getTodayDateString(),
      });
    } else {
      if (type === 'expense' && paymentMode === 'installment') {
        const count = parseInt(installmentCount, 10);
        if (isNaN(count) || count < 2 || count > 60) {
          Alert.alert('Parcelas Inválidas', 'A quantidade de parcelas deve ser entre 2 e 60.');
          return;
        }

        await addInstallmentTransaction({
          description: description.trim() || 'Compra Parcelada',
          totalAmount: numericAmount,
          installmentCount: count,
          categoryId,
          startDate: date.trim() || getTodayDateString(),
        });
      } else {
        await addTransaction({
          amount: numericAmount,
          type,
          categoryId,
          description: description.trim(),
          date: date.trim() || getTodayDateString(),
        });
      }
    }

    closeTransactionModal();
  };

  const numericVal = parseCurrencyInput(amountStr);
  const instCountNum = parseInt(installmentCount, 10) || 1;
  const perInstallmentVal = instCountNum > 0 ? numericVal / instCountNum : 0;

  return (
    <Modal
      visible={isTransactionModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={closeTransactionModal}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {editingTransaction ? 'Editar Registro' : 'Nova Movimentação'}
            </Text>
            <Pressable
              onPress={closeTransactionModal}
              android_ripple={{ color: colors.primaryLight, borderless: true, radius: 20 }}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* 1. Seletor de Tipo: Despesa vs Receita */}
            <View style={[styles.typeSwitchContainer, { backgroundColor: colors.surface }]}>
              <Pressable
                onPress={() => setType('expense')}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                style={[
                  styles.typeButton,
                  type === 'expense' && { backgroundColor: colors.expense },
                ]}
              >
                <Ionicons
                  name="arrow-up-circle-outline"
                  size={18}
                  color={type === 'expense' ? '#FFF' : colors.textSecondary}
                  style={styles.btnIcon}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: type === 'expense' ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  Despesa
                </Text>
              </Pressable>

              <Pressable
                onPress={() => {
                  setType('income');
                  setPaymentMode('single');
                }}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                style={[
                  styles.typeButton,
                  type === 'income' && { backgroundColor: colors.income },
                ]}
              >
                <Ionicons
                  name="arrow-down-circle-outline"
                  size={18}
                  color={type === 'income' ? '#FFF' : colors.textSecondary}
                  style={styles.btnIcon}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: type === 'income' ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  Receita
                </Text>
              </Pressable>
            </View>

            {/* 2. Se for Despesa (não edição), Seletor À vista vs Parcelado */}
            {type === 'expense' && !editingTransaction && (
              <View style={[styles.modeSwitchContainer, { backgroundColor: colors.inputBackground }]}>
                <Pressable
                  onPress={() => setPaymentMode('single')}
                  style={[
                    styles.modeButton,
                    paymentMode === 'single' && { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      { color: paymentMode === 'single' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    À Vista
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMode('installment')}
                  style={[
                    styles.modeButton,
                    paymentMode === 'installment' && { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <Text
                    style={[
                      styles.modeText,
                      { color: paymentMode === 'installment' ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    💳 Parcelado
                  </Text>
                </Pressable>
              </View>
            )}

            {/* 3. Campo de Valor */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                {paymentMode === 'installment' ? 'Valor Total da Compra (R$)' : 'Valor (R$)'}
              </Text>
              <View
                style={[
                  styles.amountInputContainer,
                  { backgroundColor: colors.inputBackground, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.currencyPrefix, { color: type === 'income' ? colors.income : colors.expense }]}>
                  R$
                </Text>
                <TextInput
                  value={amountStr}
                  onChangeText={setAmountStr}
                  placeholder="0,00"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="numeric"
                  style={[
                    styles.amountInput,
                    { color: colors.text },
                  ]}
                  autoFocus={!editingTransaction}
                />
              </View>
            </View>

            {/* 4. Campo de Parcelas (quando parcelado) */}
            {type === 'expense' && paymentMode === 'installment' && !editingTransaction && (
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Quantidade de Parcelas
                </Text>
                <View
                  style={[
                    styles.amountInputContainer,
                    { backgroundColor: colors.inputBackground, borderColor: colors.border },
                  ]}
                >
                  <Ionicons name="layers-outline" size={20} color={colors.primary} style={{ marginRight: 8 }} />
                  <TextInput
                    value={installmentCount}
                    onChangeText={setInstallmentCount}
                    placeholder="12"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="number-pad"
                    style={[styles.amountInput, { color: colors.text }]}
                  />
                  <Text style={{ color: colors.textSecondary, fontSize: 13 }}>x</Text>
                </View>
                {numericVal > 0 && instCountNum > 1 && (
                  <Text style={[styles.installmentPreview, { color: colors.primary }]}>
                    Serão criadas {instCountNum} parcelas mensais de {formatCurrencyBRL(perInstallmentVal)}
                  </Text>
                )}
              </View>
            )}

            {/* 5. Seletor de Categoria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Categoria</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {availableCategories.map((cat: Category) => {
                  const isSelected = cat.id === categoryId;
                  return (
                    <Pressable
                      key={cat.id}
                      onPress={() => setCategoryId(cat.id)}
                      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                      style={[
                        styles.categoryPill,
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
                      <Text
                        style={[
                          styles.categoryPillText,
                          { color: isSelected ? '#FFF' : colors.text },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            {/* 6. Data e Descrição */}
            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  {paymentMode === 'installment' ? 'Data da 1ª Parcela' : 'Data (AAAA-MM-DD)'}
                </Text>
                <TextInput
                  value={date}
                  onChangeText={setDate}
                  placeholder="2026-08-24"
                  placeholderTextColor={colors.textSecondary}
                  style={[
                    styles.textInput,
                    { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
                  ]}
                />
              </View>
              <Pressable
                style={[
                  styles.todayBtn,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
                android_ripple={{ color: colors.primaryLight, borderless: false }}
                onPress={() => setDate(getTodayDateString())}
              >
                <Text style={[styles.todayBtnText, { color: colors.primary }]}>Hoje</Text>
              </Pressable>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Descrição / Estabelecimento</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Ex: Notebook, Almoço, Uber..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            {/* Botão de Ação Salvar com Ripple */}
            <View style={styles.saveButtonWrapper}>
              <Pressable
                onPress={handleSave}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
                style={[
                  styles.saveButton,
                  { backgroundColor: type === 'income' ? colors.income : colors.primary },
                ]}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
                <Text style={styles.saveButtonText}>
                  {editingTransaction
                    ? 'Salvar Alterações'
                    : paymentMode === 'installment'
                    ? 'Gerar Parcelas'
                    : 'Registrar Agora'}
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 25,
    maxHeight: '90%',
    borderTopWidth: 1,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
  },
  scrollBody: {
    paddingBottom: 15,
  },
  typeSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnIcon: {
    marginRight: 6,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  modeSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 12,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
  },
  installmentPreview: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    paddingLeft: 4,
  },
  categoryScroll: {
    paddingVertical: 4,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  textInput: {
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  todayBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  todayBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveButtonWrapper: {
    marginTop: 10,
  },
  saveButton: {
    flexDirection: 'row',
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
