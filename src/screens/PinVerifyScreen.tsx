import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { colors, spacing, fontSize } from '../theme';
import { getPinHash } from '../storage/passwords';

function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) - hash) + pin.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

interface Props {
  onVerified: () => void;
}

export function PinVerifyScreen({ onVerified }: Props) {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handlePress = async (digit: string) => {
    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      const stored = await getPinHash();
      if (stored === simpleHash(newPin)) {
        onVerified();
      } else {
        setAttempts(a => a + 1);
        setPin('');
        if (attempts >= 4) {
          Alert.alert('错误次数过多', '请稍后再试');
        }
      }
    }
  };

  const handleDelete = () => setPin(prev => prev.slice(0, -1));

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔒</Text>
      <Text style={styles.title}>输入 PIN 密码</Text>
      <Text style={styles.subtitle}>剩余 {5 - attempts} 次尝试</Text>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {[['1','2','3'],['4','5','6'],['7','8','9'],['','0','⌫']].map((row, ri) => (
          <View key={ri} style={styles.keypadRow}>
            {row.map((key, ki) => (
              key === '' ? <View key={ki} style={styles.keyPlaceholder} /> :
              <TouchableOpacity
                key={ki}
                style={styles.key}
                onPress={() => key === '⌫' ? handleDelete() : handlePress(key)}
              >
                <Text style={styles.keyText}>{key}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text, marginTop: spacing.sm },
  subtitle: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: spacing.sm },
  dots: { flexDirection: 'row', gap: spacing.lg, marginVertical: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: colors.textTertiary },
  dotFilled: { backgroundColor: colors.primary, borderColor: colors.primary },
  keypad: { marginTop: spacing.lg },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginBottom: spacing.md },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
    elevation: 2,
  },
  keyPlaceholder: { width: 72, height: 72 },
  keyText: { fontSize: 28, color: colors.text },
});
