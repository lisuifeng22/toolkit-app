import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, fontSize } from '../theme';
import { loadNotes, deleteNote } from '../storage/notes';
import { Note } from '../types';

const colorMap: Record<string, string> = {
  '#FF6F00': colors.secondaryLight,
  '#2E7D32': colors.successLight,
  '#6A1B9A': colors.purpleLight,
  '#1565C0': colors.infoLight,
};

export function NotesScreen() {
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
      style={[styles.noteCard, { backgroundColor: colorMap[item.colorTag] || colors.white }]}
      activeOpacity={0.7}
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
        ListEmptyComponent={<Text style={styles.emptyText}>暂无便签{'\n'}点击右上角 + 添加</Text>}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('NoteEditor', {})}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: fontSize.sm, color: colors.textDisabled, textAlign: 'center', lineHeight: 22 },
  row: { gap: spacing.md, marginBottom: spacing.md },
  noteCard: {
    flex: 1,
    borderRadius: 16, padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
    minHeight: 100,
  },
  noteContent: { fontSize: fontSize.sm, color: colors.text, lineHeight: 20, flex: 1 },
  noteDate: { fontSize: fontSize.xs, color: colors.textDisabled, marginTop: spacing.sm },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2, shadowRadius: 4,
  },
  fabText: { fontSize: 28, color: colors.white, lineHeight: 30 },
});
