import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, spacing, fontSize } from '../theme';

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
            width: '100%', height: 48, borderRadius: 12, padding: 12,
            fontSize: 16, border: `1px solid ${colors.border}`,
            backgroundColor: colors.white, color: colors.text,
            outline: 'none', boxSizing: 'border-box',
          }}
        />
      ) : (
        <>
          <TouchableOpacity style={styles.pickerBtn} onPress={() => setShow(true)}>
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
    backgroundColor: colors.white, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  pickerText: { fontSize: fontSize.md, color: colors.text },
  pickerIcon: { fontSize: 16 },
});
