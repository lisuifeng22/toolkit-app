import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { Colors, Layout } from '../constants/Colors';

const menuItems = [
  { label: '首页', icon: '🏠', route: 'Dashboard' },
  { label: '天气', icon: '☀️', route: 'Weather' },
  { label: '便签', icon: '📝', route: 'Notes' },
  { label: '待办', icon: '✅', route: 'Todos' },
  { label: '倒计时', icon: '⏱', route: 'Countdowns' },
  { label: '生日', icon: '🎂', route: 'Birthdays' },
  { label: '纪念日', icon: '❤️', route: 'Anniversaries' },
  { label: '密码本', icon: '🔒', route: 'Password' },
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
              // item.route 是已知的 route name 字面量, 但 TS 无法推导 navigate 参数
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              onPress={() => navigation.navigate(item.route as any)}
              activeOpacity={0.7}
            >
              <Text style={styles.icon}>{item.icon}</Text>
              <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>{item.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    padding: Layout.spacing.xl,
    paddingTop: 48,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  avatarText: { color: Colors.sidebarText, fontSize: 20, fontWeight: '700' },
  appName: { fontSize: 20, fontWeight: '700', color: Colors.sidebarText },
  subtitle: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  menu: { padding: Layout.spacing.sm, paddingTop: Layout.spacing.md },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Layout.spacing.md,
    borderRadius: Layout.radius.base,
    marginBottom: 2,
  },
  menuItemActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  icon: { fontSize: 18, marginRight: Layout.spacing.md },
  menuLabel: { fontSize: 15, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  menuLabelActive: { color: Colors.sidebarText, fontWeight: '600' },
});
