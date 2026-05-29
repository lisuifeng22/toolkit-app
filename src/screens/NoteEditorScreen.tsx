import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize } from '../theme';
import { loadNotes, addNote, updateNote } from '../storage/notes';

const colorOptions = ['#FF6F00', '#2E7D32', '#6A1B9A', '#1565C0'];

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
        placeholderTextColor={colors.textDisabled}
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
          />
        ))}
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveText}>保存</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  input: {
    flex: 1, fontSize: fontSize.md,
    color: colors.text, lineHeight: 24,
    textAlignVertical: 'top',
    backgroundColor: colors.white,
    borderRadius: 16, padding: spacing.lg,
  },
  colorRow: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: spacing.md, marginBottom: spacing.lg,
  },
  colorLabel: { fontSize: fontSize.sm, color: colors.textSecondary, marginRight: spacing.sm },
  colorDot: { width: 28, height: 28, borderRadius: 14, marginHorizontal: 4 },
  colorDotSelected: { borderWidth: 3, borderColor: colors.primary },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 12, padding: spacing.md,
    alignItems: 'center',
  },
  saveText: { color: colors.white, fontSize: fontSize.md, fontWeight: '600' },
});
