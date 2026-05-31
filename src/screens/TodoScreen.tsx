import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Layout } from '../constants/Colors';
import { loadTodos, toggleTodo, deleteTodo } from '../storage/todos';
import { Todo, TodosStackParamList } from '../types';

export function TodoScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TodosStackParamList>>();
  const [todos, setTodos] = useState<Todo[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadTodos().then(setTodos);
    }, []),
  );

  const handleToggle = async (id: string) => {
    await toggleTodo(id);
    setTodos((prev) => prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const handleDelete = (id: string) => {
    Alert.alert('删除待办', '确定删除吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: async () => {
          await deleteTodo(id);
          setTodos((prev) => prev.filter((t) => t.id !== id));
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Todo }) => (
    <TouchableOpacity style={styles.todoCard} activeOpacity={0.85} onLongPress={() => handleDelete(item.id)}>
      <TouchableOpacity
        style={[styles.checkbox, item.completed && styles.checkboxDone]}
        onPress={() => handleToggle(item.id)}
        activeOpacity={0.85}
      >
        {item.completed && <Text style={styles.checkmark}>✓</Text>}
      </TouchableOpacity>
      <View style={styles.todoContent}>
        <Text style={[styles.todoTitle, item.completed && styles.todoDone]}>{item.title}</Text>
        {item.dueDate && <Text style={styles.dueDate}>截止 {new Date(item.dueDate).toLocaleDateString('zh-CN')}</Text>}
      </View>
    </TouchableOpacity>
  );

  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <View style={styles.container}>
      <View style={styles.progressCard}>
        <Text style={styles.progressText}>完成进度</Text>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${todos.length > 0 ? (completedCount / todos.length) * 100 : 0}%` }]}
          />
        </View>
        <Text style={styles.progressCount}>
          {completedCount} / {todos.length}
        </Text>
      </View>

      <FlatList
        data={todos}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={todos.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无待办{'\n'}点击右下角 + 添加</Text>}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={() => navigation.navigate('TodoEditor', {})}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  list: { padding: Layout.spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: Colors.textPlaceholder, textAlign: 'center', lineHeight: 22 },
  progressCard: {
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    margin: Layout.spacing.md,
    marginBottom: 0,
    padding: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  progressText: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  progressBar: {
    height: 8,
    backgroundColor: Colors.gray,
    borderRadius: 4,
    marginTop: Layout.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
  progressCount: { fontSize: 12, color: Colors.textSecondary, marginTop: Layout.spacing.xs, textAlign: 'right' },
  todoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.sm,
    ...Layout.shadow.light,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Layout.spacing.md,
  },
  checkboxDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  todoContent: { flex: 1 },
  todoTitle: { fontSize: 16, color: Colors.textPrimary },
  todoDone: { textDecorationLine: 'line-through', color: Colors.textPlaceholder },
  dueDate: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
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
