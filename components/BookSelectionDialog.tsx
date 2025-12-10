import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

interface BibleBook {
  id: string;
  label: string;
  chapters: number;
}
interface BibleCategory {
  id: string;
  label: string;
  books: BibleBook[];
}

interface BookSelectionDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (bookId: string, chapter: number) => void;
  data: BibleCategory[];
}

export function BookSelectionDialog({ visible, onClose, onSelect, data }: BookSelectionDialogProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';
  
  const [step, setStep] = useState<'book' | 'chapter'>('book');
  const [selectedBook, setSelectedBook] = useState<BibleBook | null>(null);

  const handleBookSelect = (book: BibleBook) => {
    setSelectedBook(book);
    setStep('chapter');
  };

  const handleChapterSelect = (chapter: number) => {
    if (selectedBook) {
      onSelect(selectedBook.id, chapter);
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    // Reset state after a delay to avoid flicker during close animation
    setTimeout(() => {
      setStep('book');
      setSelectedBook(null);
    }, 300);
  };

  const handleBack = () => {
    if (step === 'chapter') {
      setStep('book');
      setSelectedBook(null);
    } else {
      handleClose();
    }
  };

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtitleColor = isDark ? '#AAAAAA' : '#666666';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
      <Animated.View 
        entering={ZoomIn.duration(200)}
        style={[
          styles.dialogContainer, 
          { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <TouchableOpacity onPress={handleBack} style={styles.iconButton}>
           {step === 'chapter' ? (
               <Ionicons name="arrow-back" size={24} color={textColor} />
           ) : (
               <Ionicons name="close" size={24} color={textColor} />
           )}
          </TouchableOpacity>
          
          <Text style={[styles.title, { color: textColor }]}>
            {step === 'book' ? 'בחר ספר' : selectedBook?.label}
          </Text>
          
          <View style={styles.iconButton} /> 
        </View>

        {/* Content */}
        <ScrollView 
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {step === 'book' ? (
            // BOOK SELECTION LIST
            <View>
              {data.map((category) => (
                <View key={category.id} style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: subtitleColor }]}>{category.label}</Text>
                  <View style={styles.list}>
                    {category.books.map((book) => (
                      <TouchableOpacity 
                        key={book.id} 
                        style={[
                            styles.bookListItem, 
                            { 
                                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
                                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
                            }
                        ]}
                        onPress={() => handleBookSelect(book)}
                      >
                        <Text style={[styles.bookListText, { color: textColor }]}>{book.label}</Text>
                        <Ionicons name="chevron-back" size={16} color={subtitleColor} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          ) : (
            // CHAPTER SELECTION GRID
            <View style={styles.chapterGrid}>
              {selectedBook && Array.from({ length: selectedBook.chapters }, (_, i) => i + 1).map((chapter) => (
                <TouchableOpacity
                  key={chapter}
                  style={[styles.chapterItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                  onPress={() => handleChapterSelect(chapter)}
                >
                  <Text style={[styles.chapterText, { color: textColor }]}>{chapter}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'right', // Hebrew
  },
  list: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  bookListText: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'right', 
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
  },
  chapterItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 18,
    fontWeight: '600',
  },
});
