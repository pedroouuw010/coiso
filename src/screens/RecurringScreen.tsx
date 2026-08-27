import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { RecurringCard } from '../components/RecurringCard';
import { RecurringExpense, RecurringFrequency } from '../@types';
import { formatCurrencyBRL } from '../utils/formatters';

const FREQUENCIES: { key: RecurringFrequency; label: string }[] = [
  { key: 'monthly', label: 'Mensal' },
  { key: 'weekly', label: 'Semanal' },
  { key: 'biweekly', label: 'Quinzenal' },
  { key: 'yearly', label: 'Anual' },
];

export const RecurringScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { recurring, addRecurring, updateRecurring, deleteRecurring, toggleRecurring, categories } = useFinance();

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<RecurringExpense | null>(null);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '');
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly');
  const [nextDueDate, setNextDueDate] = useState('');

  // Total mensal estimado
  const totalMonthly = recurring
    .filter((r) => r.isActive)
    .reduce((acc, r) => {
      if (r.frequency === 'weekly') return acc + r.amount * 4;
      if (r.frequency === 'biweekly') return acc + r.amount * 2;
      if (r.frequency === 'yearly') return acc + r.amount / 12;
      return acc + r.amount;
    }, 0);

  const openAddModal = () => {
    setEditingItem(null);
    setName('');
    setAmount('');
    setCategoryId(categories[0]?.id || '');
    setFrequency('monthly');
    setNextDueDate(new Date().toISOString().split('T')[0]);
    setIsModalVisible(true);
  };

  const openEditModal = (item: RecurringExpense) => {
    setEditingItem(item);
    setName(item.name);
    setAmount(item.amount.toString());
    setCategoryId(item.categoryId);
    setFrequency(item.frequency);
    setNextDueDate(item.nextDueDate.split('T')[0]);
    setIsModalVisible(true);
  };

  const handleSave = async () => {
    const cleanAmount = parseFloat(amount.replace(',', '.'));
    if (!name.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert('Atenção', 'Informe um nome e um valor válido.');
      return;
    }

    const dueISO = nextDueDate.trim()
      ? new Date(nextDueDate.trim()).toISOString()
      : new Date().toISOString();

    if (editingItem) {
      await updateRecurring({
        ...editingItem,
        name: name.trim(),
        amount: cleanAmount,
        categoryId,
        frequency,
        nextDueDate: dueISO,
      });
    } else {
      await addRecurring({
        name: name.trim(),
        amount: cleanAmount,
        categoryId,
        frequency,
        nextDueDate: dueISO,
        isActive: true,
      });
    }
    setIsModalVisible(false);
  };

  const ripple = { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: false };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Card Resumo Mensal */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total Recorrente Mensal Estimado</Text>
          <Text style={[styles.overviewAmount, { color: colors.expense }]}>{formatCurrencyBRL(totalMonthly)}</Text>
          <Text style={[styles.overviewSub, { color: colors.textSecondary }]}>
            {recurring.filter((r) => r.isActive).length} despesas fixas ativas
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Despesas Fixas & Assinaturas</Text>
          <Pressable onPress={openAddModal} android_ripple={ripple} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Novo Gasto</Text>
          </Pressable>
        </View>

        {recurring.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Ionicons name="repeat-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhum gasto recorrente cadastrado</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Cadastre suas contas de internet, streaming, aluguel ou academia para ter controle das despesas fixas.
            </Text>
          </View>
        ) : (
          recurring.map((item) => (
            <RecurringCard
              key={item.id}
              item={item}
              onEdit={() => openEditModal(item)}
              onDelete={() => deleteRecurring(item.id)}
              onToggle={() => toggleRecurring(item.id)}
            />
          ))
        )}
      </ScrollView>

      {/* Modal Formulário */}
      <Modal visible={isModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingItem ? 'Editar Gasto Recorrente' : 'Novo Gasto Recorrente'}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nome / Descrição *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: Internet Fibra ou Netflix"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valor da Cobrança (R$) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: 99.90"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Frequência</Text>
            <View style={styles.freqRow}>
              {FREQUENCIES.map((f) => (
                <Pressable
                  key={f.key}
                  onPress={() => setFrequency(f.key)}
                  style={[
                    styles.freqBtn,
                    {
                      backgroundColor: frequency === f.key ? colors.primary : colors.inputBackground,
                      borderColor: frequency === f.key ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.freqText,
                      { color: frequency === f.key ? '#FFFFFF' : colors.text },
                    ]}
                  >
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Próxima Cobrança (AAAA-MM-DD)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: 2026-09-10"
              placeholderTextColor={colors.textSecondary}
              value={nextDueDate}
              onChangeText={setNextDueDate}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Categoria</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
              {categories.map((cat) => (
                <Pressable
                  key={cat.id}
                  onPress={() => setCategoryId(cat.id)}
                  style={[
                    styles.catChip,
                    {
                      backgroundColor: categoryId === cat.id ? colors.primary : colors.inputBackground,
                      borderColor: categoryId === cat.id ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={14}
                    color={categoryId === cat.id ? '#FFFFFF' : colors.text}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={{ color: categoryId === cat.id ? '#FFFFFF' : colors.text, fontSize: 12 }}>
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setIsModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.inputBackground }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSave}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  freqRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  freqBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  freqText: {
    fontSize: 11,
    fontWeight: '700',
  },
  catScroll: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 18,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
});
