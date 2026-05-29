import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Colors, Layout } from '../constants/Colors';
import { loadCountdowns, deleteCountdown } from '../storage/countdowns';
import { getDaysRemaining } from '../utils/dates';
import { Countdown } from '../types';

export function CountdownScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<(Countdown & { days: number })[]>([]);

  useFocusEffect(useCallback(() => {
    loadCountdowns().then(data => {
      setItems(data.map(c => ({ ...c, days: getDaysRemaining(c.targetDate) })).sort((a, b) => a.days - b.days));
    });
  }, []));

  const handleDelete = (id: string) => {
    Alert.alert('删除倒计时', '确定删除吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteCountdown(id);
        setItems(prev => prev.filter(c => c.id !== id));
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Countdown & { days: number } }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.85}
      onLongPress={() => handleDelete(item.id)}
    >
      <Text style={styles.days}>{item.days}</Text>
      <Text style={styles.daysLabel}>天</Text>
      <View style={styles.cardRight}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.target}>目标日期：{item.targetDate}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无倒计时{'\n'}点击右下角 + 添加</Text>}
      />
      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('CountdownEditor', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Layout.spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textPlaceholder, textAlign: 'center', lineHeight: 22 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  days: { fontSize: 36, fontWeight: '700', color: Colors.primary, width: 60, textAlign: 'center' },
  daysLabel: { fontSize: 14, color: Colors.textSecondary, marginRight: Layout.spacing.md },
  cardRight: { flex: 1 },
  title: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  target: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Layout.shadow.hover,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
