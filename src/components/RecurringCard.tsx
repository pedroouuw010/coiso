import React from 'react';
import { View, Text, Pressable, StyleSheet, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecurringExpense } from '../@types';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { formatDateBR } from '../utils/dateUtils';
import { formatCurrencyBRL } from '../utils/formatters';

interface Props {
  item: RecurringExpense;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: () => void;
}

export const RecurringCard: React.FC<Props> = ({ item, onEdit, onDelete, onToggle }) => {
  const { colors, isDark } = useTheme();
  const { getCategoryById } = useFinance();
  const category = getCategoryById(item.categoryId);

  const getFrequencyLabel = (freq: string) => {
    switch (freq) {
      case 'weekly': return 'Semanal';
      case 'biweekly': return 'Quinzenal';
      case 'monthly': return 'Mensal';
      case 'yearly': return 'Anual';
      case 'custom': return `A cada ${item.customDays || 30} dias`;
      default: return 'Mensal';
    }
  };

  const ripple = { color: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)', borderless: false };

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, opacity: item.isActive ? 1 : 0.65 }]}>
      <View style={styles.header}>
        <View style={[styles.iconBox, { backgroundColor: (category?.color || colors.primary) + '20' }]}>
          <Ionicons name={(category?.icon || 'repeat-outline') as any} size={22} color={category?.color || colors.primary} />
        </View>
        <View style={styles.titleBlock}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
          <Text style={[styles.categoryName, { color: colors.textSecondary }]}>
            {category?.name || 'Geral'} • {getFrequencyLabel(item.frequency)}
          </Text>
        </View>
        <Switch
          value={item.isActive}
          onValueChange={onToggle}
          trackColor={{ false: '#CBD5E1', true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      </View>

      <View style={styles.infoRow}>
        <View>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Valor por cobrança</Text>
          <Text style={[styles.amountText, { color: colors.expense }]}>{formatCurrencyBRL(item.amount)}</Text>
        </View>
        <View style={styles.rightInfo}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Próximo vencimento</Text>
          <Text style={[styles.dueDateText, { color: colors.text }]}>{formatDateBR(item.nextDueDate)}</Text>
        </View>
      </View>

      <View style={[styles.actionsRow, { borderTopColor: colors.border }]}>
        <Pressable
          onPress={onEdit}
          android_ripple={ripple}
          style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]}
        >
          <Ionicons name="create-outline" size={16} color={colors.primary} />
          <Text style={[styles.actionText, { color: colors.primary }]}>Editar</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Alert.alert('Excluir Gasto Recorrente', `Deseja apagar "${item.name}"?`, [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Excluir', style: 'destructive', onPress: onDelete },
            ]);
          }}
          android_ripple={ripple}
          style={[styles.actionBtn, { backgroundColor: colors.expenseLight }]}
        >
          <Ionicons name="trash-outline" size={16} color={colors.expense} />
          <Text style={[styles.actionText, { color: colors.expense }]}>Excluir</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
  },
  header: {
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
  titleBlock: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
  },
  categoryName: {
    fontSize: 12,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  rightInfo: {
    alignItems: 'flex-end',
  },
  infoLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  amountText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  dueDateText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
