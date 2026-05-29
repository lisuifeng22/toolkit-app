import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Layout } from '../constants/Colors';
import { loadNotes, deleteNote } from '../storage/notes';
import { Note } from '../types';

const colorMap: Record<string, string> = {
  '#FF6F00': Colors.primaryLighter,
  '#2E7D32': Colors.primaryLighter,
  '#6A1B9A': Colors.primaryLighter,
  '#1565C0': Colors.primaryLighter,
};

export function NoteScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const [notes, setNotes] = useState<Note[]>([]);

  useFocusEffect(useCallback(() => { loadNotes().then(setNotes); }, []));

  const handleDelete = (id: string) => {
    Alert.alert('删除便签', '确定删除这条便签吗？', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => {
        await deleteNote(id);
        setNotes(prev => prev.filter(n => n.id !== id));
      }},
    ]);
  };

  const renderItem = ({ item }: { item: Note }) => (
    <TouchableOpacity
      style={styles.noteCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate('NoteEditor', { noteId: item.id })}
      onLongPress={() => handleDelete(item.id)}
    >
      <Text style={styles.noteContent} numberOfLines={4}>{item.content}</Text>
      <Text style={styles.noteDate}>
        {new Date(item.updatedAt).toLocaleDateString('zh-CN')}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={notes}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={notes.length === 0 ? styles.empty : styles.list}
        ListEmptyComponent={<Text style={styles.emptyText}>暂无便签{'\n'}点击右下角 + 添加</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('NoteEditor', {})}
      >
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
  row: { gap: Layout.spacing.md, marginBottom: Layout.spacing.md },
  noteCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large,
    padding: Layout.spacing.md,
    minHeight: 100,
    ...Layout.shadow.light,
  },
  noteContent: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20, flex: 1 },
  noteDate: { fontSize: 12, color: Colors.textPlaceholder, marginTop: Layout.spacing.sm },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    ...Layout.shadow.hover,
  },
  fabText: { fontSize: 28, color: '#fff', lineHeight: 30 },
});
