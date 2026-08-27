import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { CategoryModal } from '../components/CategoryModal';
import { Category } from '../@types';

export const CategoriesScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { categories, deleteCategory } = useFinance();
  const [modalVisible, setModalVisible] = useState(false);

  const handleDeleteCategory = async (category: Category) => {
    if (category.isDefault) {
      Alert.alert('Aviso', 'Categorias padrão do sistema não podem ser excluídas.');
      return;
    }

    Alert.alert(
      'Excluir Categoria',
      `Deseja realmente excluir a categoria "${category.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteCategory(category.id);
            if (!success) {
              Alert.alert(
                'Atenção',
                'Esta categoria possui transações vinculadas e não pode ser removida.'
              );
            }
          },
        },
      ]
    );
  };

  const incomeCategories = categories.filter(c => c.type === 'income' || c.type === 'both');
  const expenseCategories = categories.filter(c => c.type === 'expense' || c.type === 'both' || !c.type);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Gerenciador de Categorias</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Organize suas despesas e receitas
          </Text>
        </View>

        <View style={styles.addBtnWrapper}>
          <Pressable
            onPress={() => setModalVisible(true)}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="add" size={20} color="#FFF" />
            <Text style={styles.addBtnText}>Nova</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Seção Despesas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.expense }]}>
            Categorias de Despesa ({expenseCategories.length})
          </Text>
          <View style={styles.grid}>
            {expenseCategories.map(cat => (
              <View
                key={cat.id}
                style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                  {cat.name}
                </Text>
                {!cat.isDefault && (
                  <Pressable
                    onPress={() => handleDeleteCategory(cat)}
                    android_ripple={{ color: 'rgba(239, 68, 68, 0.2)', borderless: true, radius: 16 }}
                    style={styles.deleteIcon}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.expense} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Seção Receitas */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.income }]}>
            Categorias de Receita ({incomeCategories.length})
          </Text>
          <View style={styles.grid}>
            {incomeCategories.map(cat => (
              <View
                key={cat.id}
                style={[styles.catCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.catIcon, { backgroundColor: cat.color + '20' }]}>
                  <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                </View>
                <Text style={[styles.catName, { color: colors.text }]} numberOfLines={1}>
                  {cat.name}
                </Text>
                {!cat.isDefault && (
                  <Pressable
                    onPress={() => handleDeleteCategory(cat)}
                    android_ripple={{ color: 'rgba(239, 68, 68, 0.2)', borderless: true, radius: 16 }}
                    style={styles.deleteIcon}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.expense} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Criação */}
      <CategoryModal visible={modalVisible} onClose={() => setModalVisible(false)} />
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
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtnWrapper: {
    borderRadius: 14,
    overflow: 'hidden',
    elevation: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 4,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  catCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    elevation: 1,
  },
  catIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  catName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteIcon: {
    padding: 6,
    borderRadius: 12,
  },
});
