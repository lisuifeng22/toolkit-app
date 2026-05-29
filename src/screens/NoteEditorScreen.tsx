import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Layout } from '../constants/Colors';
import { loadNotes, addNote, updateNote } from '../storage/notes';

const colorOptions = ['#7C3AED', '#10B981', '#F59E0B', '#3B82F6'];

export function NoteEditorScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const noteId = route.params?.noteId;
  const [content, setContent] = useState('');
  const [colorTag, setColorTag] = useState(colorOptions[0]);

  useEffect(() => {
    if (noteId) {
      loadNotes().then(notes => {
        const note = notes.find(n => n.id === noteId);
        if (note) {
          setContent(note.content);
          setColorTag(note.colorTag);
        }
      });
    }
  }, [noteId]);

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('提示', '请输入内容');
      return;
    }
    if (noteId) {
      await updateNote(noteId, { content: content.trim(), colorTag });
    } else {
      await addNote({
        id: Date.now().toString(),
        content: content.trim(),
        colorTag,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        multiline
        placeholder="写点什么..."
        placeholderTextColor={Colors.textPlaceholder}
        value={content}
        onChangeText={setContent}
        autoFocus
      />
      <View style={styles.colorRow}>
        <Text style={styles.colorLabel}>标签颜色：</Text>
        {colorOptions.map(c => (
          <TouchableOpacity
            key={c}
            style={[styles.colorDot, { backgroundColor: c }, colorTag === c && styles.colorDotSelected]}
            onPress={() => setColorTag(c)}
            activeOpacity={0.8}
          />
        ))}
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
        <Text style={styles.saveText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Layout.spacing.md },
  input: {
    flex: 1, fontSize: 16,
    color: Colors.textPrimary, lineHeight: 24,
    textAlignVertical: 'top',
    backgroundColor: Colors.card,
    borderRadius: Layout.radius.large, padding: Layout.spacing.md,
    ...Layout.shadow.light,
  },
  colorRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: Layout.spacing.md, marginBottom: Layout.spacing.lg,
  },
  colorLabel: { fontSize: 14, color: Colors.textSecondary, marginRight: Layout.spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14, marginHorizontal: 4 },
  colorDotSelected: { borderWidth: 3, borderColor: Colors.primary },
  saveBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Layout.radius.base, padding: Layout.spacing.md,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
