import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useFinance } from '../contexts/FinanceContext';

export const CustomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const { openAddTransactionModal } = useFinance();

  const getIconName = (routeName: string, isFocused: boolean): any => {
    switch (routeName) {
      case 'Dashboard':
        return isFocused ? 'home' : 'home-outline';
      case 'History':
        return isFocused ? 'receipt' : 'receipt-outline';
      case 'Budgets':
        return isFocused ? 'pie-chart' : 'pie-chart-outline';
      case 'Settings':
        return isFocused ? 'settings' : 'settings-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const getLabel = (routeName: string): string => {
    switch (routeName) {
      case 'Dashboard':
        return 'Início';
      case 'History':
        return 'Extrato';
      case 'Budgets':
        return 'Limites';
      case 'Settings':
        return 'Ajustes';
      default:
        return routeName;
    }
  };

  const leftRoutes = state.routes.slice(0, 2);
  const rightRoutes = state.routes.slice(2, 4);

  const rippleTab = {
    color: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    borderless: true,
    radius: 28,
  };

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: colors.tabBar, borderTopColor: colors.border }]}>
      {/* Primeiras 2 abas (Início e Extrato) */}
      {leftRoutes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = getIconName(route.name, isFocused);
        const label = getLabel(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            android_ripple={rippleTab}
            style={styles.tabButton}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? colors.primary : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? colors.primary : colors.tabBarInactive },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}

      {/* Botão Central [+] em Destaque Material 3 */}
      <View style={styles.centerButtonWrapper}>
        <Pressable
          onPress={openAddTransactionModal}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.3)', borderless: true, radius: 28 }}
          style={[styles.floatingPlusButton, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="add" size={32} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Últimas 2 abas (Limites e Ajustes) */}
      {rightRoutes.map((route, index) => {
        const actualIndex = index + 2;
        const isFocused = state.index === actualIndex;
        const iconName = getIconName(route.name, isFocused);
        const label = getLabel(route.name);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            android_ripple={rippleTab}
            style={styles.tabButton}
          >
            <Ionicons
              name={iconName}
              size={22}
              color={isFocused ? colors.primary : colors.tabBarInactive}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: isFocused ? colors.primary : colors.tabBarInactive },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: Platform.OS === 'ios' ? 84 : 70,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 8,
    borderTopWidth: 1,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 3,
  },
  centerButtonWrapper: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingPlusButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -28,
    elevation: 6,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
});
