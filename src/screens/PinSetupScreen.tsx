import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Layout } from '../constants/Colors';
import { setupPin } from '../storage/crypto';
import { hasLegacyData, migrateLegacyData } from '../storage/passwords';
import { RootDrawerParamList } from '../types';

export function PinSetupScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootDrawerParamList>>();
  const [pin, setPin] = useState('');
  const [confirm, setConfirm] = useState('');
  const [step, setStep] = useState<'create' | 'confirm'>('create');
  const [migrating, setMigrating] = useState(false);

  const handlePress = async (digit: string) => {
    if (step === 'create') {
      if (pin.length < 4) {
        const newPin = pin + digit;
        setPin(newPin);
        if (newPin.length === 4) {
          if (newPin === '0000' || newPin === '1234') {
            Alert.alert('提示', '建议不要使用过于简单的 PIN 码');
          }
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
            await setupPin(pin);

            // 尝试迁移旧数据
            const hasOld = await hasLegacyData();
            if (hasOld) {
              setMigrating(true);
              try {
                const { migrated } = await migrateLegacyData(pin);
                setMigrating(false);
                Alert.alert('设置成功', `PIN 已设置, 已迁移 ${migrated} 条旧密码数据`);
              } catch (e: unknown) {
                setMigrating(false);
                Alert.alert('迁移失败', `旧数据迁移失败: ${e instanceof Error ? e.message : e}. 请联系开发者。`);
              }
            } else {
              Alert.alert('设置成功', 'PIN 密码已设置');
            }
            navigation.goBack();
          } else {
            Alert.alert('不匹配', '两次输入的密码不一致, 请重新设置');
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
      setPin((prev) => prev.slice(0, -1));
    } else {
      setConfirm((prev) => prev.slice(0, -1));
    }
  };

  const dots = step === 'create' ? pin : confirm;

  if (migrating) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>正在迁移旧数据...</Text>
        <Text style={styles.subtitle}>请勿退出页面</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{step === 'create' ? '设置 PIN 密码' : '再次输入确认'}</Text>
      <Text style={styles.subtitle}>4 位数字密码</Text>

      <View style={styles.dots}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={[styles.dot, dots.length > i && styles.dotFilled]} />
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
                  style={styles.key}
                  onPress={() => (key === '⌫' ? handleDelete() : handlePress(key))}
                  activeOpacity={0.85}
                >
                  <Text style={styles.keyText}>{key}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        ))}
      </View>

      {/* 安全提示 */}
      <View style={styles.securityNote}>
        <Text style={styles.securityText}>🔒 数据仅保存在本机, 卸载 App 将导致数据丢失</Text>
        <Text style={styles.securityText}>⚠️ 建议勿使用过于简单的 PIN (如 0000、1234)</Text>
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
  title: { fontSize: 24, fontWeight: '600', color: Colors.textPrimary },
  subtitle: { fontSize: 14, color: Colors.textSecondary, marginTop: Layout.spacing.sm },
  dots: { flexDirection: 'row', gap: Layout.spacing.xl, marginVertical: 40 },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.textPlaceholder,
  },
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
  keyPlaceholder: { width: 72, height: 72 },
  keyText: { fontSize: 28, color: Colors.textPrimary },
  securityNote: {
    position: 'absolute',
    bottom: 40,
    left: Layout.spacing.xl,
    right: Layout.spacing.xl,
    alignItems: 'center',
  },
  securityText: { fontSize: 12, color: Colors.textSecondary, marginTop: Layout.spacing.xs },
});
