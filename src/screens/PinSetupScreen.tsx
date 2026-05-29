import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../theme';
import { savePinHash } from '../storage/passwords';

function simpleHash(pin: string): string {
  let hash = 0;
  for (let i = 0; i < pin.length; i++) {
    hash = ((hash << 5) - hash) + pin.charCodeAt(i);
    hash |= 0;
  }
  return hash.toString(16);
}

export function PinSetupScreen() {
  const navigation = useNavigation();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');

  const handlePress = async (digit: string) => {
    if (step === 'create') {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          setStep('confirm');
          setConfirm('');
        }
      }
    } else {
      if (confirm.length < 4) {
        const newConfirm = confirm + digit;
        setConfirm(newConfirm);
        if (newConfirm.length === 4) {
          if (newConfirm === pin) {
            await savePinHash(simpleHash(pin));
            Alert.alert('设置成功', '密码已设置');
            navigation.goBack();
          } else {
            Alert.alert('不匹配', '两次输入的密码不一致，请重新设置');
            setPin('');
            setConfirm('');
            setStep('create');
          }
        }
      }
    }
  };

  const handleDelete = () => {
    if (step === 'create') {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirm(prev => prev.slice(0, -1));
    }
  };

  const dots = step === 'create' ? pin : confirm;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {step === 'create' ? '设置 PIN 密码' : '再次输入确认'}
      </Text>
      <Text style={styles.subtitle}>4 位数字密码</Text>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map(i => (
          <View key={i} style={[styles.dot, dots.length > i && styles.dotFilled]} />
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
  title: { fontSize: fontSize.xl, fontWeight: '600', color: colors.text },
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
