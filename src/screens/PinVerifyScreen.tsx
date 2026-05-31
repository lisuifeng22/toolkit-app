import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Colors, Layout } from '../constants/Colors';
import { verifyPin, getLockoutRemainingMs, getRemainingAttempts } from '../storage/crypto';

interface Props {
  onVerified: (pin: string) => void;
}

export function PinVerifyScreen({ onVerified }: Props) {
  const [pin, setPin] = useState('');
  const [remaining, setRemaining] = useState(-1);
  const [locked, setLocked] = useState(false);
  const [countdown, setCountdown] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    checkLockout();
    getRemainingAttempts().then(setRemaining);
    // checkLockout 在组件挂载时只应执行一次, 无需加入 deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const checkLockout = async () => {
    const ms = await getLockoutRemainingMs();
    if (ms > 0) {
      setLocked(true);
      startCountdown(ms);
    }
  };

  const startCountdown = (ms: number) => {
    const update = () => {
      const left = Math.ceil((ms - (Date.now() - start)) / 1000);
      if (left <= 0) {
        setLocked(false);
        setCountdown('');
        if (timerRef.current) clearInterval(timerRef.current);
        return;
      }
      const min = Math.floor(left / 60);
      const sec = left % 60;
      setCountdown(`${min}:${sec.toString().padStart(2, '0')}`);
    };

    const start = Date.now();
    update();
    timerRef.current = setInterval(update, 1000);
  };

  const formatLockoutTime = (ms: number): string => {
    const min = Math.floor(ms / 60000);
    const sec = Math.floor((ms % 60000) / 1000);
    return `${min} 分 ${sec} 秒`;
  };

  const handlePress = async (digit: string) => {
    if (locked) return;

    const newPin = pin + digit;
    setPin(newPin);
    if (newPin.length === 4) {
      try {
        const valid = await verifyPin(newPin);
        if (valid) {
          onVerified(newPin);
        } else {
          setPin('');
          const left = await getRemainingAttempts();
          setRemaining(left);
          if (left <= 0 && !locked) {
            Alert.alert('错误次数过多', '请 5 分钟后再试');
            const ms = await getLockoutRemainingMs();
            if (ms > 0) {
              setLocked(true);
              startCountdown(ms);
            }
          } else {
            Alert.alert('PIN 错误', left > 0 ? `还剩 ${left} 次尝试` : '');
          }
        }
      } catch (e: unknown) {
        if (e instanceof Error && e.message?.startsWith('LOCKOUT:')) {
          const until = parseInt(e.message.split(':')[1], 10);
          const ms = Math.max(0, until - Date.now());
          setLocked(true);
          if (ms > 0) startCountdown(ms);
          Alert.alert('已锁定', `尝试次数过多, 请 ${formatLockoutTime(ms)} 后再试`);
        } else {
          Alert.alert('验证失败', e instanceof Error ? e.message : '未知错误');
        }
        setPin('');
      }
    }
  };

  const handleDelete = () => setPin((prev) => prev.slice(0, -1));

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔒</Text>
      <Text style={styles.title}>输入 PIN 密码</Text>
      {locked ? (
        <Text style={styles.lockedText}>已锁定, 剩余 {countdown}</Text>
      ) : (
        <Text style={styles.subtitle}>{remaining >= 0 ? `剩余 ${remaining} 次尝试` : ''}</Text>
      )}

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, pin.length > i && styles.dotFilled]} />
        ))}
      </View>

      <View style={styles.keypad}>
        {[
          ['1', '2', '3'],
          ['4', '5', '6'],
          ['7', '8', '9'],
          ['', '0', '⌫'],
        ].map((row, ri) => (
          <View key={ri} style={styles.keypadRow}>
            {row.map((key, ki) =>
              key === '' ? (
                <View key={ki} style={styles.keyPlaceholder} />
              ) : (
                <TouchableOpacity
                  key={ki}
                  style={[styles.key, locked && styles.keyDisabled]}
                  onPress={() => (key === '⌫' ? handleDelete() : handlePress(key))}
                  activeOpacity={0.85}
                  disabled={locked}
                >
                  <Text style={[styles.keyText, locked && styles.keyTextDisabled]}>{key}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary, marginTop: Layout.spacing.sm },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: Layout.spacing.sm },
  lockedText: { fontSize: 14, color: Colors.danger, marginTop: Layout.spacing.sm, fontWeight: '600' },
  dots: { flexDirection: 'row', gap: Layout.spacing.xl, marginVertical: 40 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: Colors.textPlaceholder },
  dotFilled: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  keypad: { marginTop: Layout.spacing.lg },
  keypadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
  },
  key: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...Layout.shadow.light,
  },
  keyDisabled: { opacity: 0.4 },
  keyPlaceholder: { width: 72, height: 72 },
  keyText: { fontSize: 28, color: Colors.textPrimary },
  keyTextDisabled: { color: Colors.textPlaceholder },
});
