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
import { GoalCard } from '../components/GoalCard';
import { Goal } from '../@types';
import { formatCurrencyBRL } from '../utils/formatters';

const GOAL_ICONS = [
  'flag', 'airplane', 'car-sport', 'laptop', 'home',
  'wallet', 'shield-checkmark', 'gift', 'heart', 'school',
];

export const GoalsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { goals, addGoal, updateGoal, deleteGoal, addToGoal, withdrawFromGoal } = useFinance();

  // Modais
  const [isFormModalVisible, setIsFormModalVisible] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flag');

  // Modal de Adicionar/Retirar Valor
  const [isValueModalVisible, setIsValueModalVisible] = useState(false);
  const [valueActionGoal, setValueActionGoal] = useState<Goal | null>(null);
  const [valueActionType, setValueActionType] = useState<'add' | 'withdraw'>('add');
  const [actionAmount, setActionAmount] = useState('');

  const totalSaved = goals.reduce((acc, g) => acc + g.savedAmount, 0);
  const totalTarget = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setDescription('');
    setDeadline('');
    setSelectedIcon('flag');
    setIsFormModalVisible(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(g.targetAmount.toString());
    setDescription(g.description || '');
    setDeadline(g.deadline ? g.deadline.split('T')[0] : '');
    setSelectedIcon(g.icon);
    setIsFormModalVisible(true);
  };

  const handleSaveGoal = async () => {
    const cleanAmount = parseFloat(targetAmount.replace(',', '.'));
    if (!name.trim() || isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert('Atenção', 'Informe um nome e um valor válido para a meta.');
      return;
    }

    if (editingGoal) {
      await updateGoal({
        ...editingGoal,
        name: name.trim(),
        targetAmount: cleanAmount,
        description: description.trim() || undefined,
        deadline: deadline.trim() ? new Date(deadline.trim()).toISOString() : undefined,
        icon: selectedIcon,
      });
    } else {
      await addGoal({
        name: name.trim(),
        targetAmount: cleanAmount,
        description: description.trim() || undefined,
        deadline: deadline.trim() ? new Date(deadline.trim()).toISOString() : undefined,
        icon: selectedIcon,
      });
    }
    setIsFormModalVisible(false);
  };

  const handleApplyValueAction = async () => {
    const cleanAmount = parseFloat(actionAmount.replace(',', '.'));
    if (!valueActionGoal || isNaN(cleanAmount) || cleanAmount <= 0) {
      Alert.alert('Atenção', 'Informe um valor válido.');
      return;
    }

    if (valueActionType === 'add') {
      await addToGoal(valueActionGoal.id, cleanAmount);
    } else {
      await withdrawFromGoal(valueActionGoal.id, cleanAmount);
    }
    setIsValueModalVisible(false);
    setActionAmount('');
  };

  const ripple = { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: false };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Resumo */}
        <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.overviewTop}>
            <View>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Total em Metas</Text>
              <Text style={[styles.overviewSaved, { color: colors.income }]}>{formatCurrencyBRL(totalSaved)}</Text>
            </View>
            <View style={styles.overviewRight}>
              <Text style={[styles.overviewLabel, { color: colors.textSecondary }]}>Objetivo Total</Text>
              <Text style={[styles.overviewTarget, { color: colors.text }]}>{formatCurrencyBRL(totalTarget)}</Text>
            </View>
          </View>
        </View>

        {/* Lista de Metas */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Minhas Metas ({goals.length})</Text>
          <Pressable onPress={openAddModal} android_ripple={ripple} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Nova Meta</Text>
          </Pressable>
        </View>

        {goals.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Ionicons name="flag-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nenhuma meta criada</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Defina objetivos como "Comprar Computador" ou "Reserva de Emergência" e acompanhe seu progresso.
            </Text>
          </View>
        ) : (
          goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onAddValue={() => {
                setValueActionGoal(g);
                setValueActionType('add');
                setActionAmount('');
                setIsValueModalVisible(true);
              }}
              onWithdraw={() => {
                setValueActionGoal(g);
                setValueActionType('withdraw');
                setActionAmount('');
                setIsValueModalVisible(true);
              }}
              onEdit={() => openEditModal(g)}
              onDelete={() => deleteGoal(g.id)}
              onTogglePause={() => updateGoal({ ...g, status: g.status === 'paused' ? 'active' : 'paused' })}
            />
          ))
        )}
      </ScrollView>

      {/* Modal de Formulário de Meta */}
      <Modal visible={isFormModalVisible} transparent animationType="slide">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingGoal ? 'Editar Meta' : 'Nova Meta Financeira'}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nome da Meta *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: Viagem de Férias"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valor Alvo (R$) *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: 5000.00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Prazo Desejado (AAAA-MM-DD) - Opcional</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="Ex: 2026-12-31"
              placeholderTextColor={colors.textSecondary}
              value={deadline}
              onChangeText={setDeadline}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ícone</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.iconScroll}>
              {GOAL_ICONS.map((iconName) => (
                <Pressable
                  key={iconName}
                  onPress={() => setSelectedIcon(iconName)}
                  style={[
                    styles.iconChoice,
                    {
                      backgroundColor: selectedIcon === iconName ? colors.primary : colors.inputBackground,
                      borderColor: selectedIcon === iconName ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Ionicons
                    name={iconName as any}
                    size={20}
                    color={selectedIcon === iconName ? '#FFFFFF' : colors.text}
                  />
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setIsFormModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.inputBackground }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleSaveGoal}
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Salvar</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Guardar / Retirar Valor */}
      <Modal visible={isValueModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {valueActionType === 'add' ? 'Guardar Dinheiro na Meta' : 'Retirar Dinheiro da Meta'}
            </Text>
            <Text style={[styles.modalSub, { color: colors.textSecondary }]}>
              Meta: {valueActionGoal?.name}
            </Text>

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Valor (R$)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border }]}
              placeholder="0,00"
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              autoFocus
              value={actionAmount}
              onChangeText={setActionAmount}
            />

            <View style={styles.modalButtons}>
              <Pressable
                onPress={() => setIsValueModalVisible(false)}
                style={[styles.modalBtn, { backgroundColor: colors.inputBackground }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={handleApplyValueAction}
                style={[
                  styles.modalBtn,
                  { backgroundColor: valueActionType === 'add' ? colors.income : colors.expense },
                ]}
              >
                <Text style={{ color: '#FFFFFF', fontWeight: '700' }}>Confirmar</Text>
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
  overviewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overviewLabel: { fontSize: 12, marginBottom: 4 },
  overviewSaved: { fontSize: 24, fontWeight: 'bold' },
  overviewRight: { alignItems: 'flex-end' },
  overviewTarget: { fontSize: 18, fontWeight: '600' },
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
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 4 },
  modalSub: { fontSize: 13, marginBottom: 14 },
  inputLabel: { fontSize: 12, fontWeight: '600', marginTop: 10, marginBottom: 4 },
  input: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  iconScroll: { flexDirection: 'row', marginVertical: 10 },
  iconChoice: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
