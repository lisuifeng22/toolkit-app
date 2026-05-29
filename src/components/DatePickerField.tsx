import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Colors, Layout } from '../constants/Colors';

let DateTimePicker: any = () => null;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

type DateTimePickerEvent = any;

type Props = {
  value: Date;
  onChange: (date: Date) => void;
  mode?: 'date' | 'time';
  label?: string;
};

export function DatePickerField({ value, onChange, mode = 'date', label }: Props) {
  const [show, setShow] = useState(false);

  const handleChange = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) onChange(selectedDate);
  };

  const formatDate = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  return (
    <View>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={formatDate(value)}
          onChange={(e) => {
            const val = e.target.value;
            if (val) onChange(new Date(val + 'T00:00:00'));
          }}
          style={{
            width: '100%', height: 48, borderRadius: Layout.radius.base, padding: 12,
            fontSize: 16, border: `1px solid ${Colors.border}`,
            backgroundColor: Colors.card, color: Colors.textPrimary,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShow(true)} activeOpacity={0.85}>
            <Text style={styles.pickerText}>{formatDate(value)}</Text>
            <Text style={styles.pickerIcon}>{mode === 'date' ? '📅' : '⏰'}</Text>
          </TouchableOpacity>
          {show && (
            <DateTimePicker
              value={value}
              mode={mode}
              display="default"
              onChange={handleChange}
            />
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pickerBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.card, borderRadius: Layout.radius.large,
    padding: Layout.spacing.md, marginBottom: Layout.spacing.sm,
    ...Layout.shadow.light,
  },
  pickerText: { fontSize: 16, color: Colors.textPrimary },
  pickerIcon: { fontSize: 16 },
});
