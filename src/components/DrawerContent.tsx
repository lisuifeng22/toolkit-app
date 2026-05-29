import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { colors, spacing, fontSize } from '../theme';

const menuItems = [
  { label: '首页', icon: '🏠', route: 'Dashboard', color: colors.primaryLight },
  { label: '天气', icon: '☀️', route: 'Weather', color: colors.secondaryLight },
  { label: '便签', icon: '📝', route: 'Notes', color: colors.successLight },
  { label: '待办', icon: '✅', route: 'Todos', color: colors.infoLight },
  { label: '倒计时', icon: '⏱', route: 'Countdowns', color: colors.successLight },
  { label: '生日', icon: '🎂', route: 'Birthdays', color: colors.warningLight },
  { label: '纪念日', icon: '❤️', route: 'Anniversaries', color: colors.purpleLight },
  { label: '密码本', icon: '🔒', route: 'Password', color: colors.purpleLight },
];

export function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>M</Text>
        </View>
        <Text style={styles.appName}>工具集</Text>
        <Text style={styles.subtitle}>我的日常助手</Text>
      </View>

      <View style={styles.menu}>
        {menuItems.map((item) => {
          const isActive = props.state.routeNames[props.state.index] === item.route;
          return (
            <TouchableOpacity
              key={item.route}
              style={[styles.menuItem, isActive && styles.menuItemActive]}
              onPress={() => navigation.navigate(item.route as any)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.color }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.xl, paddingTop: 48, backgroundColor: colors.primaryLight },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: { color: colors.white, fontSize: 18, fontWeight: '600' },
  appName: { fontSize: fontSize.xl, fontWeight: '700', color: colors.primary },
  subtitle: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  menu: { padding: spacing.md },
  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.md, paddingHorizontal: spacing.md,
    borderRadius: 12, marginBottom: 2,
  },
  menuItemActive: { backgroundColor: colors.primaryLight },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  icon: { fontSize: 18 },
  menuLabel: { fontSize: fontSize.md, color: colors.text, fontWeight: '500' },
  menuLabelActive: { color: colors.primary, fontWeight: '600' },
});
