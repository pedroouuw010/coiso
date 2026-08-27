import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

export const LockScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const { authenticate, biometricTypeLabel } = useAuth();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <View style={styles.content}>
        {/* Ícone de Escudo / Biometria Material You */}
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="finger-print-outline" size={72} color={colors.primary} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>Gastos</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Seus dados estão protegidos. Toque no botão abaixo ou use sua {biometricTypeLabel} para
          desbloquear.
        </Text>

        {/* Botão de Desbloqueio com Ripple Nativo do Android */}
        <View style={styles.buttonWrapper}>
          <Pressable
            onPress={authenticate}
            android_ripple={{ color: 'rgba(255, 255, 255, 0.25)', borderless: false }}
            style={[styles.unlockButton, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="lock-open-outline" size={22} color="#FFFFFF" style={styles.btnIcon} />
            <Text style={styles.buttonText}>Desbloquear com {biometricTypeLabel}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '88%',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    width: 128,
    height: 128,
    borderRadius: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 36,
  },
  buttonWrapper: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  btnIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
