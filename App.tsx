import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { FinanceProvider } from './src/contexts/FinanceContext';
import { AppNavigator } from './src/navigation/AppNavigator';
import { LockScreen } from './src/components/LockScreen';

const RootContent = () => {
  const { isUnlocked } = useAuth();

  if (!isUnlocked) {
    return <LockScreen />;
  }

  return (
    <FinanceProvider>
      <AppNavigator />
    </FinanceProvider>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <RootContent />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
