import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../theme';
import { loadAnniversaries, addAnniversary, deleteAnniversary } from '../storage/anniversaries';
import { getDaysRemaining, getDaysSince } from '../utils/dates';
import { Anniversary } from '../types';
import { DatePickerField } from '../components/DatePickerField';

export function AnniversariesScreen() {
  const [items, setItems] = useState<(Anniversary & { days: number; since: number })[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState(new Date());

  useFocusEffect(useCallback(() => {
    loadAnniversaries().then(data => {
      setItems(data.map(a => ({ ...a, days: getDaysRemaining(a.date), since: getDaysSince(a.date) })).sort((a, b) => a.days - b.days));
    });
  }, []));

  const handleAdd = async () => {
    if (!eventTitle.trim()) {
      Alert.alert('提示', '请填写事件名称');
      return;
    }
    const y = eventDate.getFullYear();
    const m = String(eventDate.getMonth() + 1).padStart(2, '0');
    const d = String(eventDate.getDate()).padStart(2, '0');
    await addAnniversary({
      id: Date.now().toString(), title: eventTitle.trim(),
      date: `${y}-${m}-${d}`, createdAt: Date.now(),
    });
    setEventTitle(''); setEventDate(new Date()); setShowAdd(false);
    const data = await loadAnniversaries();
    setItems(data.map(a => ({ ...a, days: getDaysRemaining(a.date), since: getDaysSince(a.date) })).sort((a, b) => a.days - b.days));
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除', '确定删除吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteAnniversary(id);
        setItems(prev => prev.filter(a => a.id !== id));
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Anniversary & { days: number; since: number } }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>❤️</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.titleText}>{item.title}</Text>
        <Text style={styles.dateText}>已 {item.since} 天</Text>
      </View>
      <View style={styles.daysBox}>
        <Text style={styles.daysNum}>{item.days}</Text>
        <Text style={styles.daysLabel}>天</Text>
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
        ListEmptyComponent={<Text style={styles.emptyText}>暂无纪念日</Text>}
      />

      {showAdd ? (
        <View style={styles.addForm}>
          <TextInput style={styles.input} placeholder="事件名称" value={eventTitle} onChangeText={setEventTitle} />
          <DatePickerField value={eventDate} onChange={setEventDate} />
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: fontSize.sm, color: colors.textDisabled },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: { fontSize: 18 },
  cardBody: { flex: 1 },
  titleText: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  dateText: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  daysBox: { alignItems: 'center' },
  daysNum: { fontSize: 24, fontWeight: '700', color: colors.purple },
  daysLabel: { fontSize: fontSize.xs, color: colors.textTertiary },
  addForm: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  input: {
    fontSize: fontSize.md, color: colors.text,
    backgroundColor: colors.background, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  formBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    backgroundColor: colors.background, alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary },
  addBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  addBtnText: { color: colors.white, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 28, color: colors.white, lineHeight: 30 },
});
