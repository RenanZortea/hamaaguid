import { ThemedView } from '@/components/themed-view';
import { BIBLE_STRUCTURE } from '@/constants/bibleData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const ChapterItem = React.memo(({ 
    chapter, 
    onSelect, 
    isDark, 
    textColor 
}: { 
    chapter: number; 
    onSelect: (chapter: number) => void; 
    isDark: boolean; 
    textColor: string; 
}) => (
    <TouchableOpacity
        style={[
            styles.chapterItem, 
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]}
        onPress={() => onSelect(chapter)}
    >
        <Text style={[styles.chapterText, { color: textColor }]}>{toHebrewNumeral(chapter)}</Text>
    </TouchableOpacity>
));

export default function ChapterSelectionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const bookId = Array.isArray(params.bookId) ? params.bookId[0] : params.bookId;

  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';
  const textColor = Colors[theme].text;

  // Find the book data
  const bookData = useMemo(() => {
    for (const category of BIBLE_STRUCTURE) {
        const found = category.books.find(b => b.id === bookId);
        if (found) return found;
    }
    return null;
  }, [bookId]);

  const chapters = useMemo(() => {
    if (!bookData) return [];
    return Array.from({ length: bookData.chapters }, (_, i) => i + 1);
  }, [bookData]);

  const handleChapterSelect = (chapter: number) => {
    if (!bookId) return;
    
    // Navigate back to Reader with params
    // We use router.dismissAll() to go back to root (or reader) if possible, 
    // but best to just replace to reader to ensure stack is clean or simple push.
    // The user flow is Reader -> BookSel -> ChapSel -> Reader.
    // Using dismiss() x 2 might be better, or navigate to reader directly.
    // Let's rely on router.replace to reader.
    
    // Assuming we want to pop the selection screens:
    router.dismissTo('/(tabs)/reader'); // Dismisses back to reader if it exists in stack
    router.replace({
        pathname: '/(tabs)/reader',
        params: { book: bookId, chapter: String(chapter) }
    });
  };

  if (!bookData) {
      return (
          <ThemedView style={styles.container}>
              <Stack.Screen options={{ title: 'שגיאה' }} />
              <View style={styles.center}>
                  <Text style={{ color: textColor }}>ספר לא נמצא</Text>
              </View>
          </ThemedView>
      );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: bookData.label, headerBackTitle: 'חזרה' }} />
      
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.chapterGrid}>
           {chapters.map((chapter) => (
            <ChapterItem 
                key={chapter} 
                chapter={chapter} 
                onSelect={handleChapterSelect} 
                isDark={isDark} 
                textColor={textColor} 
            />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center'
  },
  content: {
    padding: 20,
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center', // Center grid items
    gap: 16,
  },
  chapterItem: {
    width: 60, // Slightly larger for easier tapping
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'TaameyFrank-Bold', 
  },
});
