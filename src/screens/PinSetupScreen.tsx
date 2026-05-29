import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Layout } from '../constants/Colors';
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
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary },
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
