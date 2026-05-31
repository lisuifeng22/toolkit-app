import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Layout } from '../constants/Colors';
import { loadPasswords, addPassword, deletePassword, hasLegacyData, isMigrated } from '../storage/passwords';
import { isPinSetup } from '../storage/crypto';
import { PinSetupScreen } from './PinSetupScreen';
import { PinVerifyScreen } from './PinVerifyScreen';
import { Password } from '../types';

export function PasswordScreen() {
  const [items, setItems] = useState<Password[]>([]);
  const [state, setState] = useState<'check' | 'setup' | 'list'>('check');
  const [showAdd, setShowAdd] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [notes, setNotes] = useState('');
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');
  const pinRef = useRef('');

  const checkState = useCallback(async () => {
    const setup = await isPinSetup();
    if (!setup) {
      setState('setup');
      return;
    }
    setState('check');
    setError('');

    // 检查旧数据
    if (!(await isMigrated()) && (await hasLegacyData())) {
      setError('检测到旧版加密数据, 请重新设置 PIN 以完成迁移');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      checkState();
    }, [checkState]),
  );

  // PIN 验证成功后的回调 — 唯一路径
  const handleVerifiedWrapper = useCallback((verifiedPin: string) => {
    pinRef.current = verifiedPin;
    setState('list');
    loadPasswords(verifiedPin).then(setItems);
  }, []);

  const handleAdd = async () => {
    if (!siteName.trim() || !password.trim()) {
      Alert.alert('提示', '请填写网站名和密码');
      return;
    }

    const currentPin = pinRef.current;
    if (!currentPin) {
      Alert.alert('错误', 'PIN 未验证, 请重新进入密码本');
      return;
    }

    const newItems = await addPassword(currentPin, {
      id: Date.now().toString(),
      siteName: siteName.trim(),
      username: username.trim(),
      password: password.trim(),
      notes: notes.trim(),
    });
    setSiteName('');
    setUsername('');
    setPassword('');
    setNotes('');
    setShowAdd(false);
    setItems(newItems);
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除', '确定删除这条密码吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          const currentPin = pinRef.current;
          if (!currentPin) return;
          const newItems = await deletePassword(currentPin, id);
          setItems(newItems);
        },
      },
    ]);
  };

  if (state === 'setup') return <PinSetupScreen />;
  if (state === 'check') return <PinVerifyScreen onVerified={handleVerifiedWrapper} />;

  const renderItem = ({ item }: { item: Password }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.siteIcon}>
        <Text style={styles.siteLetter}>{item.siteName[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.siteName}>{item.siteName}</Text>
        <Text style={styles.username}>{item.username || '无用户名'}</Text>
        <TouchableOpacity
          onPress={() => setRevealed((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
          activeOpacity={0.85}
        >
          <Text style={styles.passwordText}>{revealed[item.id] ? item.password : '••••••••'}</Text>
        </TouchableOpacity>
        {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 安全提示横幅 */}
      <View style={styles.banner}>
        <Text style={styles.bannerText}>🔒 数据仅本地保存, AES-256-GCM 加密存储</Text>
        <Text style={styles.bannerText}>⚠️ 卸载 App 将导致数据丢失</Text>
      </View>

      {error ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>{pinRef.current ? '暂无密码' : '正在验证...'}</Text>}
      />

      {showAdd ? (
        <View style={styles.addForm}>
          <TextInput
            style={styles.input}
            placeholder="网站/应用名"
            placeholderTextColor={Colors.textPlaceholder}
            value={siteName}
            onChangeText={setSiteName}
          />
          <TextInput
            style={styles.input}
            placeholder="用户名"
            placeholderTextColor={Colors.textPlaceholder}
            value={username}
            onChangeText={setUsername}
          />
          <TextInput
            style={styles.input}
            placeholder="密码"
            placeholderTextColor={Colors.textPlaceholder}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="备注"
            placeholderTextColor={Colors.textPlaceholder}
            value={notes}
            onChangeText={setNotes}
          />
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)} activeOpacity={0.85}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd} activeOpacity={0.85}>
              <Text style={styles.addBtnText}>保存</Text>
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
  banner: {
    backgroundColor: Colors.primaryLighter,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  bannerText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16 },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.sm,
  },
  errorText: { fontSize: 12, color: Colors.danger },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  siteIcon: {
    width: 44,
    height: 44,
    borderRadius: Layout.radius.small,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  siteLetter: { fontSize: 18, fontWeight: '600', color: Colors.primary },
  cardBody: { flex: 1 },
  siteName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  username: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  passwordText: { fontSize: 14, color: Colors.info, marginTop: 2 },
  notes: { fontSize: 12, color: Colors.textPlaceholder, marginTop: 4, fontStyle: 'italic' },
  addForm: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Layout.radius.large,
    borderTopRightRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    ...Layout.shadow.hover,
  },
  input: {
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.gray,
    borderRadius: Layout.radius.base,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
  },
  formBtns: { flexDirection: 'row', gap: Layout.spacing.md, marginTop: Layout.spacing.sm },
  cancelBtn: {
    flex: 1,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.base,
    backgroundColor: Colors.gray,
    alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary },
  addBtn: {
    flex: 1,
    padding: Layout.spacing.md,
    borderRadius: Layout.radius.base,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Layout.shadow.hover,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
