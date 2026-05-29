import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../theme';
import { loadTodos, addTodo, updateTodo } from '../storage/todos';

export function TodoEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const todoId = route.params?.todoId;
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (todoId) {
      loadTodos().then(todos => {
        const todo = todos.find(t => t.id === todoId);
        if (todo) setTitle(todo.title);
      });
    }
  }, [todoId]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('提示', '请输入待办内容');
      return;
    }
    if (todoId) {
      await updateTodo(todoId, { title: title.trim() });
    } else {
      await addTodo({
        id: Date.now().toString(),
        title: title.trim(),
        completed: false,
        dueDate: null,
        createdAt: Date.now(),
      });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="输入待办事项..."
        placeholderTextColor={colors.textDisabled}
        value={title}
        onChangeText={setTitle}
        autoFocus
      />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  input: {
    fontSize: fontSize.md, color: colors.text,
    backgroundColor: colors.white, borderRadius: 16,
    padding: spacing.lg, marginBottom: spacing.lg,
  },
  saveBtn: {
    backgroundColor: colors.primary, borderRadius: 12,
    padding: spacing.md, alignItems: 'center',
  },
  saveText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
