import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../theme';
import { loadPasswords, addPassword, deletePassword, getPinHash } from '../storage/passwords';
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
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useFocusEffect(useCallback(() => {
    (async () => {
      const hash = await getPinHash();
      if (!hash) { setState('setup'); return; }
      setState('check');
    })();
  }, []));

  const handleVerified = () => {
    setState('list');
    loadPasswords().then(setItems);
  };

  const handleAdd = async () => {
    if (!siteName.trim() || !password.trim()) {
      Alert.alert('提示', '请填写网站名和密码');
      return;
    }
    await addPassword({
      id: Date.now().toString(),
      siteName: siteName.trim(),
      username: username.trim(),
      password: password.trim(),
      notes: '',
    });
    setSiteName(''); setUsername(''); setPassword('');
    setShowAdd(false);
    setItems(await loadPasswords());
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除', '确定删除这条密码吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deletePassword(id);
        setItems(prev => prev.filter(p => p.id !== id));
      }},
    ]);
  };

  if (state === 'setup') return <PinSetupScreen />;
  if (state === 'check') return <PinVerifyScreen onVerified={handleVerified} />;

  const renderItem = ({ item }: { item: Password }) => (
    <TouchableOpacity style={styles.card} activeOpacity={0.7} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.siteIcon}>
        <Text style={styles.siteLetter}>{item.siteName[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.siteName}>{item.siteName}</Text>
        <Text style={styles.username}>{item.username || '无用户名'}</Text>
        <TouchableOpacity onPress={() => setRevealed(prev => ({ ...prev, [item.id]: !prev[item.id] }))}>
          <Text style={styles.passwordText}>
            {revealed[item.id] ? item.password : '••••••••'}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={items.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无密码</Text>}
      />

      {showAdd ? (
        <View style={styles.addForm}>
          <TextInput style={styles.input} placeholder="网站/应用名" value={siteName} onChangeText={setSiteName} />
          <TextInput style={styles.input} placeholder="用户名" value={username} onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry />
          <View style={styles.formBtns}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAdd(false)}>
              <Text style={styles.cancelText}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <Text style={styles.addBtnText}>保存</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.fab} onPress={() => setShowAdd(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: fontSize.sm, color: colors.textDisabled },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 16,
    padding: spacing.lg, marginBottom: spacing.md,
  },
  siteIcon: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: colors.purpleLight, alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  siteLetter: { fontSize: fontSize.lg, fontWeight: '600', color: colors.purple },
  cardBody: { flex: 1 },
  siteName: { fontSize: fontSize.md, fontWeight: '500', color: colors.text },
  username: { fontSize: fontSize.sm, color: colors.textTertiary, marginTop: 2 },
  passwordText: { fontSize: fontSize.sm, color: colors.info, marginTop: 2 },
  addForm: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.white, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: spacing.lg, shadowColor: '#000', shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 10,
  },
  input: {
    fontSize: fontSize.md, color: colors.text,
    backgroundColor: colors.background, borderRadius: 12,
    padding: spacing.md, marginBottom: spacing.sm,
  },
  formBtns: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  cancelBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    backgroundColor: colors.background, alignItems: 'center',
  },
  cancelText: { color: colors.textSecondary },
  addBtn: {
    flex: 1, padding: spacing.md, borderRadius: 12,
    backgroundColor: colors.primary, alignItems: 'center',
  },
  addBtnText: { color: colors.white, fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 4,
  },
  fabText: { fontSize: 28, color: colors.white, lineHeight: 30 },
});
