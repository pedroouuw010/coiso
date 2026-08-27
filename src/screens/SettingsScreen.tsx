import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  Pressable,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { useFinance } from '../contexts/FinanceContext';
import { storageService } from '../services/storageService';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NUBANK_KEY = '@finance_nubank_enabled_v1';

export const SettingsScreen: React.FC = () => {
  const { colors, toggleTheme, isDark } = useTheme();
  const { isBiometricSupported, isBiometricEnabled, toggleBiometrics, biometricTypeLabel } = useAuth();
  const navigation = useNavigation<any>();
  const { transactions, categories, exportCSV, exportJSON } = useFinance();
  const [isExporting, setIsExporting] = useState(false);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      await exportCSV();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      await exportJSON();
    } finally {
      setIsExporting(false);
    }
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (!isBiometricSupported) {
      Alert.alert(
        'Biometria Indisponível',
        'Seu dispositivo Android não possui biometria cadastrada ou suporte a hardware biométrico.'
      );
      return;
    }
    const success = await toggleBiometrics(value);
    if (!success && value) {
      Alert.alert('Autenticação Falhou', 'Não foi possível confirmar sua biometria.');
    }
  };

  const handleClearAllData = () => {
    Alert.alert(
      'Limpar Todos os Dados',
      'ATENÇÃO: Esta ação apagará permanentemente todas as suas transações e metas no aparelho. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Apagar Tudo',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearAllData();
            Alert.alert('Sucesso', 'Todos os dados foram resetados com sucesso.');
          },
        },
      ]
    );
  };

  const rippleConfig = {
    color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    borderless: false,
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Ajustes & Configurações</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Personalização, segurança biométrica e backups
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
        {/* Card de Estatísticas do App */}
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statHeader}>
            <Ionicons name="stats-chart" size={20} color={colors.primary} />
            <Text style={[styles.statTitle, { color: colors.text }]}>Estatísticas Locais</Text>
          </View>
          <View style={styles.statRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{transactions.length}</Text>
              <Text style={[styles.statDesc, { color: colors.textSecondary }]}>Transações</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.income }]}>{categories.length}</Text>
              <Text style={[styles.statDesc, { color: colors.textSecondary }]}>Categorias</Text>
            </View>
          </View>
        </View>

        {/* 1. SEÇÃO DE SEGURANÇA E BIOMETRIA */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>SEGURANÇA & PRIVACIDADE</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="finger-print" size={22} color={colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingName, { color: colors.text }]}>
                    Bloqueio por {biometricTypeLabel}
                  </Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    {isBiometricSupported
                      ? isBiometricEnabled
                        ? 'Proteção biométrica ativa'
                        : 'Exigir digital ao abrir o app'
                      : 'Hardware biométrico não detectado'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isBiometricEnabled}
                onValueChange={handleToggleBiometrics}
                disabled={!isBiometricSupported}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>
        </View>


        {/* 3. SEÇÃO DE APARÊNCIA */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APARÊNCIA (MATERIAL YOU)</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.primary} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingName, { color: colors.text }]}>Modo Escuro (Dark Mode)</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    {isDark ? 'Tema escuro ativado' : 'Tema claro ativado'}
                  </Text>
                </View>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#CBD5E1', true: colors.primary }}
                thumbColor={'#FFFFFF'}
              />
            </View>
          </View>
        </View>

        {/* 3. SEÇÃO DE CATEGORIAS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ORGANIZAÇÃO</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => navigation.navigate('Categories')}
              android_ripple={rippleConfig}
              style={styles.settingRow}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: colors.incomeLight }]}>
                  <Ionicons name="pricetags-outline" size={20} color={colors.income} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingName, { color: colors.text }]}>Gerenciador de Categorias</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Criar e personalizar categorias
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        {/* 4. SEÇÃO DE BACKUP & EXPORTAÇÃO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>BACKUP & EXPORTAÇÃO</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Exportar CSV */}
            <Pressable
              onPress={handleExportCSV}
              android_ripple={rippleConfig}
              style={[styles.settingRow, styles.borderedRow, { borderBottomColor: colors.border }]}
              disabled={isExporting}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: '#10B98120' }]}>
                  <Ionicons name="document-text-outline" size={20} color="#10B981" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingName, { color: colors.text }]}>Exportar Extrato (CSV)</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Compatível com Excel e Google Planilhas
                  </Text>
                </View>
              </View>
              {isExporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
              )}
            </Pressable>

            {/* Exportar JSON */}
            <Pressable
              onPress={handleExportJSON}
              android_ripple={rippleConfig}
              style={styles.settingRow}
              disabled={isExporting}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: '#6366F120' }]}>
                  <Ionicons name="cloud-download-outline" size={20} color="#6366F1" />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingName, { color: colors.text }]}>Backup Completo (JSON)</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Salvar cópia integral de dados locais
                  </Text>
                </View>
              </View>
              {isExporting ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
              )}
            </Pressable>
          </View>
        </View>

        {/* 5. ZONA DE PERIGO */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.expense }]}>DADOS LOCAIS</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={handleClearAllData}
              android_ripple={{ color: 'rgba(239, 68, 68, 0.15)' }}
              style={styles.settingRow}
            >
              <View style={styles.settingLeft}>
                <View style={[styles.iconWrap, { backgroundColor: colors.expenseLight }]}>
                  <Ionicons name="trash" size={20} color={colors.expense} />
                </View>
                <View style={styles.settingTextContainer}>
                  <Text style={[styles.settingName, { color: colors.expense }]}>Resetar Todos os Dados</Text>
                  <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                    Apagar todas as transações locais
                  </Text>
                </View>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Rodapé Informativo */}
        <View style={styles.footerInfo}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Gastos • Android MD3
          </Text>
          <Text style={[styles.footerTextSub, { color: colors.textSecondary }]}>
            100% Offline • Sem rastreamento • Biometria local
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  scrollBody: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  statCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 16,
    elevation: 2,
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  statDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 32,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingLeft: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  borderedRow: {
    borderBottomWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  settingTextContainer: {
    flex: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingName: {
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  footerInfo: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  footerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  footerTextSub: {
    fontSize: 11,
    marginTop: 4,
  },
  dividerLine: {
    height: 1,
    marginHorizontal: 16,
  },
  settingHint: {
    fontSize: 11,
    marginTop: 8,
    paddingHorizontal: 4,
    lineHeight: 16,
  },
});
