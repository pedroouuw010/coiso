import React from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Transaction, Category } from '../@types';
import { useTheme } from '../contexts/ThemeContext';
import { formatCurrency, formatDateDisplay } from '../utils/formatters';

interface TransactionCardProps {
  transaction: Transaction;
  category?: Category;
  onPress?: () => void;
  onDelete?: () => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({
  transaction,
  category,
  onPress,
  onDelete,
}) => {
  const { colors, isDark } = useTheme();
  const isIncome = transaction.type === 'income';

  const categoryIcon = (category?.icon as any) || (isIncome ? 'arrow-down-outline' : 'arrow-up-outline');
  const categoryColor = category?.color || (isIncome ? colors.income : colors.expense);
  const categoryName = category?.name || 'Sem Categoria';

  const handleDeletePrompt = () => {
    Alert.alert(
      'Excluir Transação',
      `Deseja realmente apagar o registro "${transaction.description || categoryName}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Excluir', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  const rippleColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <View style={[styles.cardWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        onPress={onPress}
        android_ripple={{ color: rippleColor, borderless: false }}
        style={styles.container}
      >
        <View style={styles.leftContent}>
          <View style={[styles.iconBadge, { backgroundColor: categoryColor + '20' }]}>
            <Ionicons name={categoryIcon} size={22} color={categoryColor} />
          </View>

          <View style={styles.textContainer}>
            <Text style={[styles.description, { color: colors.text }]} numberOfLines={1}>
              {transaction.description || categoryName}
            </Text>
            <View style={styles.metaRow}>
              <Text style={[styles.categoryName, { color: categoryColor }]}>{categoryName}</Text>
              <Text style={[styles.dot, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                {formatDateDisplay(transaction.date)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.rightContent}>
          <Text
            style={[
              styles.amount,
              { color: isIncome ? colors.income : colors.expense },
            ]}
          >
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </Text>

          {onDelete && (
            <Pressable
              onPress={handleDeletePrompt}
              android_ripple={{ color: 'rgba(239, 68, 68, 0.2)', borderless: true, radius: 18 }}
              style={styles.deleteButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
            </Pressable>
          )}
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginHorizontal: 16,
    marginVertical: 5,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  description: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
  },
  dot: {
    marginHorizontal: 4,
    fontSize: 12,
  },
  dateText: {
    fontSize: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  deleteButton: {
    padding: 4,
    borderRadius: 12,
  },
});
