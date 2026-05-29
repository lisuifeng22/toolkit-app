import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize } from '../theme';
import { loadTodos, toggleTodo, deleteTodo } from '../storage/todos';
import { Todo } from '../types';

export function TodosScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [todos, setTodos] = useState<Todo[]>([]);

  useFocusEffect(useCallback(() => { loadTodos().then(setTodos); }, []));

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除待办', '确定删除吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteTodo(id);
        setTodos(prev => prev.filter(t => t.id !== id));
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity
      style={styles.todoCard}
      activeOpacity={0.7}
      onLongPress={() => handleDelete(item.id)}
    >
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxDone]}
        onPress={() => handleToggle(item.id)}
      >
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.todoContent}>
        <Text style={[styles.todoTitle, item.completed && styles.todoDone]}>
          {item.title}
        </Text>
        {item.dueDate && (
          <Text style={styles.dueDate}>
            截止 {new Date(item.dueDate).toLocaleDateString('zh-CN')}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.progressCard}>
        <Text style={styles.progressText}>完成进度</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }]} />
        </View>
        <Text style={styles.progressCount}>{completedCount} / {todos.length}</Text>
      </View>

      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={todos.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无待办{'\n'}点击右下角 + 添加</Text>}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TodoEditor', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.lg },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: fontSize.sm, color: colors.textDisabled, textAlign: 'center', lineHeight: 22 },
  progressCard: {
    backgroundColor: colors.white, borderRadius: 16,
    margin: spacing.lg, marginBottom: 0, padding: spacing.lg,
  },
  progressText: { fontSize: fontSize.sm, fontWeight: '600', color: colors.text },
  progressBar: {
    height: 6, backgroundColor: colors.border, borderRadius: 3,
    marginTop: spacing.sm, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: colors.info, borderRadius: 3 },
  progressCount: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: spacing.xs, textAlign: 'right' },
  todoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.white, borderRadius: 12,
    padding: spacing.lg, marginBottom: spacing.sm,
  },
  checkbox: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 2, borderColor: colors.info,
    alignItems: 'center', justifyContent: 'center',
    marginRight: spacing.md,
  },
  checkboxDone: { backgroundColor: colors.info },
  checkmark: { color: colors.white, fontSize: 14, fontWeight: '700' },
  todoContent: { flex: 1 },
  todoTitle: { fontSize: fontSize.md, color: colors.text },
  todoDone: { textDecorationLine: 'line-through', color: colors.textDisabled },
  dueDate: { fontSize: fontSize.xs, color: colors.textTertiary, marginTop: 2 },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: colors.white, lineHeight: 30 },
});
