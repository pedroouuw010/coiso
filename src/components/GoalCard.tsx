import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Goal } from '../@types';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  goal: Goal;
  onAddValue: () => void;
  onWithdraw: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePause: () => void;
}

export const GoalCard: React.FC<Props> = ({ goal, onAddValue, onWithdraw, onEdit, onDelete, onTogglePause }) => {
  const { colors, isDark } = useTheme();
  const progress = goal.targetAmount > 0 ? Math.min(goal.savedAmount / goal.targetAmount, 1) : 0;
  const pct = Math.round(progress * 100);
  const remaining = Math.max(0, goal.targetAmount - goal.savedAmount);
  const fmt = (v: number) => `R$ ${v.toFixed(2).replace('.', ',')}`;

  const barColor = pct >= 100 ? colors.income : pct >= 60 ? colors.primary : colors.warning;

  let monthsNeeded: number | null = null;
  if (goal.deadline && goal.status === 'active' && remaining > 0) {
    const now = new Date();
    const dl = new Date(goal.deadline);
    const months = (dl.getFullYear() - now.getFullYear()) * 12 + (dl.getMonth() - now.getMonth());
    if (months > 0) monthsNeeded = Math.ceil(remaining / months);
  }

  const ripple = { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: false };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name={goal.icon as any} size={22} color={colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{goal.name}</Text>
          {goal.status === 'paused' && <Text style={[styles.badge, { backgroundColor: colors.warningLight, color: colors.warning }]}>PAUSADA</Text>}
          {goal.status === 'completed' && <Text style={[styles.badge, { backgroundColor: colors.incomeLight, color: colors.income }]}>CONCLUÍDA ✓</Text>}
        </View>
        <Pressable onPress={onEdit} android_ripple={{ ...ripple, borderless: true, radius: 20 }} style={styles.editBtn}>
          <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Valores */}
      <View style={styles.valuesRow}>
        <View style={styles.valItem}>
          <Text style={[styles.valLabel, { color: colors.textSecondary }]}>Meta</Text>
          <Text style={[styles.valNum, { color: colors.text }]}>{fmt(goal.targetAmount)}</Text>
        </View>
        <View style={styles.valItem}>
          <Text style={[styles.valLabel, { color: colors.textSecondary }]}>Guardado</Text>
          <Text style={[styles.valNum, { color: colors.income }]}>{fmt(goal.savedAmount)}</Text>
        </View>
        <View style={styles.valItem}>
          <Text style={[styles.valLabel, { color: colors.textSecondary }]}>Falta</Text>
          <Text style={[styles.valNum, { color: colors.expense }]}>{fmt(remaining)}</Text>
        </View>
      </View>

      {/* Barra de progresso */}
      <View style={[styles.barBg, { backgroundColor: colors.border }]}>
        <View style={[styles.barFill, { width: `${pct}%` as any, backgroundColor: barColor }]} />
      </View>
      <Text style={[styles.pct, { color: colors.textSecondary }]}>{pct}% concluído</Text>

      {monthsNeeded && (
        <Text style={[styles.hint, { color: colors.textSecondary }]}>
          💡 Guardar {fmt(monthsNeeded)}/mês para atingir no prazo
        </Text>
      )}

      {/* Ações */}
      {goal.status !== 'completed' && (
        <View style={styles.actions}>
          <Pressable onPress={onAddValue} android_ripple={ripple} style={[styles.actionBtn, { backgroundColor: colors.incomeLight }]}>
            <Ionicons name="add-circle" size={16} color={colors.income} />
            <Text style={[styles.actionText, { color: colors.income }]}>Guardar</Text>
          </Pressable>
          <Pressable onPress={onWithdraw} android_ripple={ripple} style={[styles.actionBtn, { backgroundColor: colors.expenseLight }]}>
            <Ionicons name="remove-circle" size={16} color={colors.expense} />
            <Text style={[styles.actionText, { color: colors.expense }]}>Retirar</Text>
          </Pressable>
          <Pressable onPress={onTogglePause} android_ripple={ripple} style={[styles.actionBtn, { backgroundColor: colors.warningLight }]}>
            <Ionicons name={goal.status === 'paused' ? 'play' : 'pause'} size={16} color={colors.warning} />
            <Text style={[styles.actionText, { color: colors.warning }]}>{goal.status === 'paused' ? 'Retomar' : 'Pausar'}</Text>
          </Pressable>
          <Pressable onPress={() => Alert.alert('Excluir', `Excluir a meta "${goal.name}"?`, [{ text: 'Cancelar', style: 'cancel' }, { text: 'Excluir', style: 'destructive', onPress: onDelete }])} android_ripple={ripple} style={[styles.actionBtn, { backgroundColor: colors.expenseLight }]}>
            <Ionicons name="trash" size={16} color={colors.expense} />
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 20, borderWidth: 1, padding: 16, marginBottom: 12, elevation: 2 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  titleBlock: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  badge: { fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, alignSelf: 'flex-start', marginTop: 2 },
  editBtn: { padding: 4 },
  valuesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  valItem: { alignItems: 'center' },
  valLabel: { fontSize: 11, marginBottom: 2 },
  valNum: { fontSize: 14, fontWeight: '700' },
  barBg: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: 8, borderRadius: 4 },
  pct: { fontSize: 12, textAlign: 'right', marginBottom: 4 },
  hint: { fontSize: 12, marginTop: 4, marginBottom: 8 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 12 },
  actionText: { fontSize: 12, fontWeight: '700' },
});
