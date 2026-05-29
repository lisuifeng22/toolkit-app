import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Layout } from '../constants/Colors';
import { loadBirthdays, addBirthday, deleteBirthday } from '../storage/birthdays';
import { getDaysRemaining, formatDate } from '../utils/dates';
import { Birthday } from '../types';
import { DatePickerField } from '../components/DatePickerField';

export function BirthdayScreen() {
  const [items, setItems] = useState<(Birthday & { days: number })[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());

  useFocusEffect(useCallback(() => {
    loadBirthdays().then(data => {
      setItems(data.map(b => ({ ...b, days: getDaysRemaining(b.birthDate) })).sort((a, b) => a.days - b.days));
    });
  }, []));

  const handleAdd = async () => {
    if (!name.trim()) {
      Alert.alert('提示', '请填写姓名');
      return;
    }
    const y = birthDate.getFullYear();
    const m = String(birthDate.getMonth() + 1).padStart(2, '0');
    const d = String(birthDate.getDate()).padStart(2, '0');
    await addBirthday({
      id: Date.now().toString(), name: name.trim(),
      birthDate: `${y}-${m}-${d}`, repeatYearly: true,
    });
    setName('');
    setBirthDate(new Date());
    setShowAdd(false);
    const data = await loadBirthdays();
    setItems(data.map(b => ({ ...b, days: getDaysRemaining(b.birthDate) })).sort((a, b) => a.days - b.days));
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除', '确定删除吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteBirthday(id);
        setItems(prev => prev.filter(b => b.id !== id));
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Birthday & { days: number } }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.name[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.dateText}>🎂 {formatDate(item.birthDate)}</Text>
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
        ListEmptyComponent={<Text style={styles.emptyText}>暂无生日记录</Text>}
      />

      {showAdd ? (
        <View style={styles.addForm}>
          <TextInput style={styles.input} placeholder="姓名" placeholderTextColor={Colors.textPlaceholder} value={name} onChangeText={setName} />
          <DatePickerField value={birthDate} onChange={setBirthDate} />
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)} activeOpacity={0.85}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>添加</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)} activeOpacity={0.85}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Layout.spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textPlaceholder },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  avatarCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  avatarText: { fontSize: 18, fontWeight: '600', color: Colors.primary },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  dateText: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  daysBox: { alignItems: 'center' },
  daysNum: { fontSize: 24, fontWeight: '700', color: Colors.primary },
  daysLabel: { fontSize: 12, color: Colors.textSecondary },
  addForm: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Layout.radius.large,
    borderTopRightRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    ...Layout.shadow.hover,
  },
  input: {
    fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.gray, borderRadius: Layout.radius.base,
    padding: Layout.spacing.md, marginBottom: Layout.spacing.sm,
  },
  formBtns: { flexDirection: 'row', gap: Layout.spacing.md, marginTop: Layout.spacing.sm },
  cancelBtn: {
    flex: 1, padding: Layout.spacing.md, borderRadius: Layout.radius.base,
    backgroundColor: Colors.gray, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary },
  addBtn: {
    flex: 1, padding: Layout.spacing.md, borderRadius: Layout.radius.base,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Layout.shadow.hover,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
