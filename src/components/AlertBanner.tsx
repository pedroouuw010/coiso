import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppAlert } from '../@types';
import { useTheme } from '../contexts/ThemeContext';

interface Props {
  alerts: AppAlert[];
}

export const AlertBanner: React.FC<Props> = ({ alerts }) => {
  const { colors } = useTheme();

  if (!alerts || alerts.length === 0) return null;

  return (
    <View style={styles.container}>
      {alerts.map((alert) => {
        const isDanger = alert.type === 'danger';
        const bg = isDanger ? colors.expenseLight : colors.warningLight;
        const iconColor = isDanger ? colors.expense : colors.warning;
        const iconName = isDanger ? 'alert-circle' : 'warning-outline';

        return (
          <View
            key={alert.id}
            style={[styles.alertBox, { backgroundColor: bg, borderColor: iconColor + '40' }]}
          >
            <Ionicons name={iconName} size={20} color={iconColor} style={styles.icon} />
            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: iconColor }]}>{alert.title}</Text>
              <Text style={[styles.message, { color: colors.text }]}>{alert.message}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  icon: {
    marginRight: 10,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  message: {
    fontSize: 12,
    lineHeight: 16,
  },
});
