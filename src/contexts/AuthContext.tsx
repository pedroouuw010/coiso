import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextData {
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  isUnlocked: boolean;
  biometricTypeLabel: string;
  authenticate: () => Promise<boolean>;
  toggleBiometrics: (enable: boolean) => Promise<boolean>;
  lockApp: () => void;
}

const STORAGE_KEY_BIOMETRIC = '@finance_biometric_enabled_v1';

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(true);
  const [biometricTypeLabel, setBiometricTypeLabel] = useState('Biometria');

  const appState = useRef(AppState.currentState);

  // 1. Verificar suporte a hardware biométrico e estado salvo
  useEffect(() => {
    const initBiometrics = async () => {
      try {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        const supported = hasHardware && isEnrolled;
        setIsBiometricSupported(supported);

        if (supported) {
          const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricTypeLabel('Reconhecimento Facial');
          } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricTypeLabel('Impressão Digital');
          } else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
            setBiometricTypeLabel('Íris');
          }
        }

        const savedEnabled = await AsyncStorage.getItem(STORAGE_KEY_BIOMETRIC);
        const isEnabled = savedEnabled === 'true' && supported;
        setIsBiometricEnabled(isEnabled);

        // Se a biometria estiver ativada, inicia bloqueado para pedir autenticação
        if (isEnabled) {
          setIsUnlocked(false);
          // Executa a primeira autenticação automática
          performAuth();
        } else {
          setIsUnlocked(true);
        }
      } catch (error) {
        console.error('Erro ao inicializar biometria:', error);
        setIsUnlocked(true);
      }
    };

    initBiometrics();
  }, []);

  // 2. Monitorar AppState do Android para bloquear ao ir para segundo plano
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App voltou para primeiro plano
        if (isBiometricEnabled) {
          setIsUnlocked(false);
          performAuth();
        }
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isBiometricEnabled]);

  const performAuth = async (): Promise<boolean> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear Gastos',
        cancelLabel: 'Cancelar',
        fallbackLabel: 'Usar Senha/PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setIsUnlocked(true);
        return true;
      } else {
        setIsUnlocked(false);
        return false;
      }
    } catch (error) {
      console.error('Erro durante autenticação:', error);
      return false;
    }
  };

  const toggleBiometrics = async (enable: boolean): Promise<boolean> => {
    if (enable) {
      // Para ativar, exige autenticação prévia de confirmação
      const success = await performAuth();
      if (success) {
        setIsBiometricEnabled(true);
        await AsyncStorage.setItem(STORAGE_KEY_BIOMETRIC, 'true');
        return true;
      }
      return false;
    } else {
      // Desativar
      setIsBiometricEnabled(false);
      setIsUnlocked(true);
      await AsyncStorage.setItem(STORAGE_KEY_BIOMETRIC, 'false');
      return true;
    }
  };

  const lockApp = () => {
    if (isBiometricEnabled) {
      setIsUnlocked(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isBiometricSupported,
        isBiometricEnabled,
        isUnlocked,
        biometricTypeLabel,
        authenticate: performAuth,
        toggleBiometrics,
        lockApp,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
