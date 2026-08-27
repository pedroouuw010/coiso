import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Budget, Category } from '../@types';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency } from '../utils/formatters';

interface BudgetCardProps {
  budget: Budget;
  category?: Category;
  spentAmount: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const BudgetCard: React.FC<BudgetCardProps> = ({
  budget,
  category,
  spentAmount,
  onEdit,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();

  const limit = budget.limitAmount;
  const percentage = limit > 0 ? (spentAmount / limit) * 100 : 0;
  const clampedPercentage = Math.min(percentage, 100);

  // Cor dinâmica do Material Design 3
  let statusColor = colors.income; // 🟢 Verde (< 70%)
  let statusBg = colors.incomeLight;
  let statusText = 'Normal';

  if (percentage >= 100) {
    statusColor = colors.expense; // 🔴 Vermelho (>= 100%)
    statusBg = colors.expenseLight;
    statusText = 'Limite Atingido!';
  } else if (percentage >= 70) {
    statusColor = colors.warning; // 🟡 Amarelo (70% - 99%)
    statusBg = colors.warningLight;
    statusText = 'Atenção';
  }

  const categoryIcon = (category?.icon as any) || 'pricetag-outline';
  const categoryColor = category?.color || colors.primary;
  const categoryName = category?.name || 'Sem Categoria';

  const handleDeletePrompt = () => {
    Alert.alert(
      'Remover Limite',
      `Deseja remover o limite da categoria "${categoryName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const rippleIcon = {
    color: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.1)',
    borderless: true,
    radius: 18,
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Cabeçalho do Card */}
      <View style={styles.header}>
        <View style={styles.categoryInfo}>
          <View style={[styles.iconBadge, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons name={categoryIcon} size={20} color={categoryColor} />
          </View>
          <View>
            <Text style={[styles.categoryName, { color: colors.text }]}>{categoryName}</Text>
            <Text style={[styles.subText, { color: colors.textSecondary }]}>
              Limite Mensal
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          <View style={[styles.statusBadge, { backgroundColor: statusBg }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
          </View>

          {onEdit && (
            <Pressable onPress={onEdit} android_ripple={rippleIcon} style={styles.actionBtn}>
              <Ionicons name="pencil-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          )}

          {onDelete && (
            <Pressable onPress={handleDeletePrompt} android_ripple={{ ...rippleIcon, color: 'rgba(239, 68, 68, 0.2)' }} style={styles.actionBtn}>
              <Ionicons name="trash-outline" size={18} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Valores: Gasto vs Limite */}
      <View style={styles.valuesRow}>
        <Text style={[styles.spentText, { color: colors.text }]}>
          {formatCurrency(spentAmount)}{' '}
          <Text style={[styles.limitText, { color: colors.textSecondary }]}>
            de {formatCurrency(limit)}
          </Text>
        </Text>
        <Text style={[styles.percentageText, { color: statusColor }]}>
          {percentage.toFixed(0)}%
        </Text>
      </View>

      {/* Barra de Progresso Material Design 3 */}
      <View style={[styles.progressBarBackground, { backgroundColor: colors.surface }]}>
        <View
          style={[
            styles.progressBarFill,
            {
              width: `${clampedPercentage}%`,
              backgroundColor: statusColor,
            },
          ]}
        />
      </View>

      {/* Restante */}
      <View style={styles.footerRow}>
        <Text style={[styles.remainingText, { color: colors.textSecondary }]}>
          {limit - spentAmount >= 0
            ? `Restam ${formatCurrency(limit - spentAmount)}`
            : `Excedido em ${formatCurrency(Math.abs(limit - spentAmount))}`}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    padding: 18,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '700',
  },
  subText: {
    fontSize: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionBtn: {
    padding: 6,
    marginLeft: 2,
    borderRadius: 14,
  },
  valuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  spentText: {
    fontSize: 16,
    fontWeight: '700',
  },
  limitText: {
    fontSize: 14,
    fontWeight: '400',
  },
  percentageText: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  footerRow: {
    marginTop: 8,
    alignItems: 'flex-start',
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
