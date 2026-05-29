import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
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
      <Text style={styles.emoji}>🔒</Text>
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
                activeOpacity={0.85}
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
  container: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginTop: Layout.spacing.sm },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: Layout.spacing.sm },
  dots: { flexDirection: 'row', gap: Layout.spacing.xl, marginVertical: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.textPlaceholder },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  keypad: { marginTop: Layout.spacing.lg },
  keypadRow: { flexDirection: 'row', justifyContent: 'center', gap: Layout.spacing.md, marginBottom: Layout.spacing.md },
  key: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: Colors.card, alignItems: 'center', justifyContent: 'center',
    ...Layout.shadow.light,
  },
  keyPlaceholder: { width: 72, height: 72 },
  keyText: { fontSize: 28, color: Colors.textPrimary },
});
