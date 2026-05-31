import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Layout } from '../constants/Colors';
import { loadTodos, addTodo, updateTodo } from '../storage/todos';
import { TodosStackParamList } from '../types';

export function TodoEditorScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<TodosStackParamList>>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- route params 由 React Navigation 推导
  const route = useRoute<any>();
  const todoId = route.params?.todoId;
  const [title, setTitle] = useState('');

  useEffect(() => {
    if (todoId) {
      loadTodos().then((todos) => {
        const todo = todos.find((t) => t.id === todoId);
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
        placeholderTextColor={Colors.textPlaceholder}
        value={title}
        onChangeText={setTitle}
        autoFocus
      />
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
        <Text style={styles.saveText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Layout.spacing.md },
  input: {
    fontSize: 16,
    color: Colors.textPrimary,
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    marginBottom: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.radius.base,
    padding: Layout.spacing.md,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
