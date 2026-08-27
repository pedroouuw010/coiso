import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useTheme } from '../contexts/ThemeContext';
import { CustomTabBar } from '../components/CustomTabBar';
import { DashboardScreen } from '../screens/DashboardScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { BudgetsScreen } from '../screens/BudgetsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { CategoriesScreen } from '../screens/CategoriesScreen';
import { GoalsScreen } from '../screens/GoalsScreen';
import { RecurringScreen } from '../screens/RecurringScreen';
import { InstallmentsScreen } from '../screens/InstallmentsScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { AssistantScreen } from '../screens/AssistantScreen';
import { TransactionModal } from '../components/TransactionModal';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="Budgets" component={BudgetsScreen} />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  );
};

export const AppNavigator: React.FC = () => {
  const { colors, isDark } = useTheme();

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  const stackHeaderOptions = (title: string) => ({
    headerShown: true,
    headerTitle: title,
    headerStyle: { backgroundColor: colors.card },
    headerTintColor: colors.text,
    headerShadowVisible: false,
  });

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen
          name="Categories"
          component={CategoriesScreen}
          options={stackHeaderOptions('Gerenciar Categorias')}
        />
        <Stack.Screen
          name="Goals"
          component={GoalsScreen}
          options={stackHeaderOptions('🎯 Metas Financeiras')}
        />
        <Stack.Screen
          name="Recurring"
          component={RecurringScreen}
          options={stackHeaderOptions('🔄 Gastos Recorrentes')}
        />
        <Stack.Screen
          name="Installments"
          component={InstallmentsScreen}
          options={stackHeaderOptions('💳 Controle de Parcelas')}
        />
        <Stack.Screen
          name="Reports"
          component={ReportsScreen}
          options={stackHeaderOptions('📊 Relatórios & Insights')}
        />
        <Stack.Screen
          name="Assistant"
          component={AssistantScreen}
          options={stackHeaderOptions('🤖 Assistente IA')}
        />
      </Stack.Navigator>
      {/* Modal global de Transações disponível em qualquer tela */}
      <TransactionModal />
    </NavigationContainer>
  );
};
