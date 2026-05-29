import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, TextInput } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, Layout } from '../constants/Colors';
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
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onLongPress={() => handleDelete(item.id)}>
      <View style={styles.siteIcon}>
        <Text style={styles.siteLetter}>{item.siteName[0]}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.siteName}>{item.siteName}</Text>
        <Text style={styles.username}>{item.username || '无用户名'}</Text>
        <TouchableOpacity onPress={() => setRevealed(prev => ({ ...prev, [item.id]: !prev[item.id] }))} activeOpacity={0.85}>
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
          <TextInput style={styles.input} placeholder="网站/应用名" placeholderTextColor={Colors.textPlaceholder} value={siteName} onChangeText={setSiteName} />
          <TextInput style={styles.input} placeholder="用户名" placeholderTextColor={Colors.textPlaceholder} value={username} onChangeText={setUsername} />
          <TextInput style={styles.input} placeholder="密码" placeholderTextColor={Colors.textPlaceholder} value={password} onChangeText={setPassword} secureTextEntry />
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
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  siteIcon: {
    width: 44, height: 44, borderRadius: Layout.radius.small,
    backgroundColor: Colors.primaryLighter,
    alignItems: 'center', justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  siteLetter: { fontSize: 18, fontWeight: '600', color: Colors.primary },
  cardBody: { flex: 1 },
  siteName: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary },
  username: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  passwordText: { fontSize: 14, color: Colors.info, marginTop: 2 },
  addForm: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: Layout.radius.large,
    borderTopRightRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    ...Layout.shadow.hover,
  },
  input: {
    fontSize: 16, color: Colors.textPrimary,
    backgroundColor: Colors.gray, borderRadius: Layout.radius.base,
    padding: Layout.spacing.md, marginBottom: Layout.spacing.sm,
  },
  formBtns: { flexDirection: 'row', gap: Layout.spacing.md, marginTop: Layout.spacing.sm },
  cancelBtn: {
    flex: 1, padding: Layout.spacing.md, borderRadius: Layout.radius.base,
    backgroundColor: Colors.gray, alignItems: 'center',
  },
  cancelText: { color: Colors.textSecondary },
  addBtn: {
    flex: 1, padding: Layout.spacing.md, borderRadius: Layout.radius.base,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  addBtnText: { color: '#fff', fontWeight: '600' },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Layout.shadow.hover,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
