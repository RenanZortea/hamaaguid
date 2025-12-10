
import { GlassView } from '@/components/ui/GlassView';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBooks, useChapters } from '@/hooks/useBible';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface SelectVerseButtonProps {
  onChapterSelect: (bookId: string, chapter: number) => void;
  style?: ViewStyle;
  label?: string;
  currentBook?: string;
  currentChapter?: number;
}

export function SelectVerseButton({ onChapterSelect, style, label = 'בחר פסוק', currentBook = '', currentChapter = 1 }: SelectVerseButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const textColor = Colors[theme].text;
  const tintColor = Colors[theme].tint;
  
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<'book' | 'chapter'>('book');
  const [selectedBook, setSelectedBook] = useState<string>('');

  const { books, loading: booksLoading } = useBooks();
  const { chapters, loading: chaptersLoading } = useChapters(selectedBook);

  const handleOpen = () => {
    setSelectedBook(currentBook);
    setStep('book');
    setVisible(true);
  };

  const handleBookSelect = (book: string) => {
    setSelectedBook(book);
    setStep('chapter');
  };

  const handleChapterSelect = (chapter: number) => {
    onChapterSelect(selectedBook, chapter);
    setVisible(false);
  };

  const handleBack = () => {
    if (step === 'chapter') {
      setStep('book');
    } else {
      setVisible(false);
    }
  };

  return (
    <>
      <TouchableOpacity 
        onPress={handleOpen} 
        style={[styles.container, style]} 
        activeOpacity={0.8}
      >
        <GlassView 
          intensity={80} 
          className="rounded-full overflow-hidden border-0"
          contentClassName="px-4 py-2"
        >
          <View style={styles.content}>
            <Text style={[styles.text, { color: textColor }]}>{label}</Text>
          </View>
        </GlassView>
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setVisible(false)}
      >
        <View style={[styles.modalContainer, { backgroundColor: Colors[theme].background }]}>
          <SafeAreaView edges={['top']} style={styles.modalHeader}>
             <View style={styles.headerContent}>
               <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                 <IconSymbol name="chevron.left" size={28} color={textColor} />
               </TouchableOpacity>
               <Text style={[styles.headerTitle, { color: textColor }]}>
                 {step === 'book' ? 'בחר ספר' : `${selectedBook} - בחר פרק`} 
               </Text>
               <View style={styles.placeholderButton} /> 
             </View>
          </SafeAreaView>

          {step === 'book' && (
            <View style={styles.listContainer}>
              {booksLoading ? (
                <ActivityIndicator size="large" color={tintColor} style={styles.loader} />
              ) : (
                <FlatList
                   data={books}
                   keyExtractor={(item) => item}
                   contentContainerStyle={styles.listContent}
                   renderItem={({ item }) => (
                     <TouchableOpacity 
                       style={[
                         styles.item, 
                         { borderBottomColor: theme === 'dark' ? '#333' : '#eee' }
                       ]}
                       onPress={() => handleBookSelect(item)}
                     >
                        <Text style={[
                          styles.itemText, 
                          { color: textColor },
                          item === currentBook && { color: tintColor, fontWeight: 'bold' }
                        ]}>
                          {item}
                        </Text>
                        <IconSymbol name="chevron.right" size={20} color={theme === 'dark' ? '#666' : '#ccc'} />
                     </TouchableOpacity>
                   )}
                />
              )}
            </View>
          )}

          {step === 'chapter' && (
             <View style={styles.listContainer}>
               {chaptersLoading ? (
                 <ActivityIndicator size="large" color={tintColor} style={styles.loader} />
               ) : (
                 <FlatList
                    data={chapters}
                    keyExtractor={(item) => item.toString()}
                    numColumns={5} // Grid layout for chapters
                    contentContainerStyle={styles.gridContent}
                    renderItem={({ item }) => (
                      <TouchableOpacity 
                        style={[
                          styles.gridItem, 
                          { backgroundColor: theme === 'dark' ? '#333' : '#f0f0f0' },
                          (item === currentChapter && selectedBook === currentBook) && { backgroundColor: tintColor }
                        ]}
                        onPress={() => handleChapterSelect(item)}
                      >
                         <Text style={[
                           styles.gridItemText, 
                           { color: textColor },
                           (item === currentChapter && selectedBook === currentBook) && { color: '#fff' }
                         ]}>
                           {item}
                         </Text>
                      </TouchableOpacity>
                    )}
                 />
               )}
             </View>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    borderBottomWidth: 1,
    borderBottomColor: '#ccc', // Will be overridden by theme usually or handled in item
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 44,
  },
  backButton: {
    padding: 8,
  },
  placeholderButton: {
    width: 44,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  listContainer: {
    flex: 1,
  },
  loader: {
    marginTop: 40,
  },
  listContent: {
    paddingBottom: 40,
  },
  item: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    writingDirection: 'rtl', // Just in case
  },
  itemText: {
    fontSize: 18,
    textAlign: 'left', // Or right mainly for Hebrew
  },
  gridContent: {
    padding: 16,
  },
  gridItem: {
    flex: 1,
    aspectRatio: 1,
    margin: 6,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemText: {
    fontSize: 18,
    fontWeight: '500',
  },
});
