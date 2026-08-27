import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TransactionType } from '../@types';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';
import { CATEGORY_ICONS_LIST, CATEGORY_COLORS_LIST } from '../constants/defaultCategories';

interface CategoryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const { addCategory } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType | 'both'>('expense');
  const [selectedIcon, setSelectedIcon] = useState(CATEGORY_ICONS_LIST[0]);
  const [selectedColor, setSelectedColor] = useState(CATEGORY_COLORS_LIST[0]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Nome Obrigatório', 'Por favor, informe o nome da categoria.');
      return;
    }

    await addCategory({
      name: name.trim(),
      icon: selectedIcon,
      color: selectedColor,
      type,
    });

    setName('');
    setSelectedIcon(CATEGORY_ICONS_LIST[0]);
    setSelectedColor(CATEGORY_COLORS_LIST[0]);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Nova Categoria</Text>
            <Pressable
              onPress={onClose}
              android_ripple={{ color: colors.primaryLight, borderless: true, radius: 18 }}
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Nome da Categoria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Nome da Categoria</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Ex: Assinaturas, Pets, Farmácia..."
                placeholderTextColor={colors.textSecondary}
                style={[
                  styles.textInput,
                  { backgroundColor: colors.inputBackground, color: colors.text, borderColor: colors.border },
                ]}
              />
            </View>

            {/* Tipo da Categoria */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Aplicável para</Text>
              <View style={[styles.typeSwitchContainer, { backgroundColor: colors.surface }]}>
                <Pressable
                  onPress={() => setType('expense')}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                  style={[
                    styles.typeButton,
                    type === 'expense' && { backgroundColor: colors.expense },
                  ]}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'expense' ? '#FFF' : colors.textSecondary }]}>
                    Despesas
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setType('income')}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                  style={[
                    styles.typeButton,
                    type === 'income' && { backgroundColor: colors.income },
                  ]}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'income' ? '#FFF' : colors.textSecondary }]}>
                    Receitas
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setType('both')}
                  android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                  style={[
                    styles.typeButton,
                    type === 'both' && { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={[styles.typeButtonText, { color: type === 'both' ? '#FFF' : colors.textSecondary }]}>
                    Ambos
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Seleção de Cor */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cor do Ícone</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.colorRow}>
                {CATEGORY_COLORS_LIST.map(color => {
                  const isSelected = color === selectedColor;
                  return (
                    <Pressable
                      key={color}
                      onPress={() => setSelectedColor(color)}
                      style={[
                        styles.colorCircle,
                        { backgroundColor: color },
                        isSelected && { borderColor: colors.text, borderWidth: 3 },
                      ]}
                    />
                  );
                })}
              </ScrollView>
            </View>

            {/* Seleção de Ícone */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Ícone</Text>
              <View style={styles.iconsGrid}>
                {CATEGORY_ICONS_LIST.map(icon => {
                  const isSelected = icon === selectedIcon;
                  return (
                    <Pressable
                      key={icon}
                      onPress={() => setSelectedIcon(icon)}
                      android_ripple={{ color: 'rgba(255, 255, 255, 0.2)', borderless: false }}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor: isSelected ? selectedColor + '25' : colors.surface,
                          borderColor: isSelected ? selectedColor : colors.border,
                        },
                      ]}
                    >
                      <Ionicons
                        name={icon as any}
                        size={24}
                        color={isSelected ? selectedColor : colors.textSecondary}
                      />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Botão Salvar */}
            <View style={styles.saveBtnWrapper}>
              <Pressable
                onPress={handleSave}
                android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
              >
                <Text style={styles.saveButtonText}>Criar Categoria</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
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
    maxHeight: '88%',
    borderTopWidth: 1,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollBody: {
    paddingBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 50,
    fontSize: 15,
  },
  typeSwitchContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
  },
  typeButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  typeButtonText: {
    fontSize: 13,
    fontWeight: '700',
  },
  colorRow: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
  },
  iconsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 8,
  },
  iconOption: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  saveBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 10,
    elevation: 3,
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
