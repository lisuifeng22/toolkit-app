import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../theme';
import { addCountdown } from '../storage/countdowns';
import { DatePickerField } from '../components/DatePickerField';

export function CountdownEditorScreen() {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState(new Date());

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请填写事件名称');
      return;
    }
    const y = targetDate.getFullYear();
    const m = String(targetDate.getMonth() + 1).padStart(2, '0');
    const d = String(targetDate.getDate()).padStart(2, '0');
    await addCountdown({
      id: Date.now().toString(),
      title: title.trim(),
      targetDate: `${y}-${m}-${d}`,
      createdAt: Date.now(),
    });
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="事件名称"
        placeholderTextColor={colors.textDisabled}
        value={title}
        onChangeText={setTitle}
      />
      <DatePickerField value={targetDate} onChange={setTargetDate} />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  input: {
    fontSize: fontSize.md, color: colors.text,
    backgroundColor: colors.white, borderRadius: 16,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center',
  },
  saveText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
