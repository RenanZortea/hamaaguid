
import { ThemedView } from '@/components/themed-view';
import { BIBLE_STRUCTURE, BibleBook, BibleCategory } from '@/constants/bibleData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import {
    SectionList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';

// --- Reused Subcomponents (Adapted for Page) ---

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
        <Text style={[styles.chapterText, { color: textColor }]}>{chapter}</Text>
    </TouchableOpacity>
));

const CollapsibleBook = React.memo(({
  book,
  onChapterSelect,
  isDark,
  textColor,
  subtitleColor
}: {
  book: BibleBook;
  onChapterSelect: (chapter: number) => void;
  isDark: boolean;
  textColor: string;
  subtitleColor: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleChapterSelect = useCallback((chapter: number) => {
    onChapterSelect(chapter);
  }, [onChapterSelect]);

  const chapters = useMemo(() => Array.from({ length: book.chapters }, (_, i) => i + 1), [book.chapters]);

  return (
    <Animated.View 
      layout={LinearTransition.duration(300)}
      style={[
        styles.bookContainer,
        { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      ]}
    >
      <TouchableOpacity
        style={[
            styles.bookListItem,
            {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF', // Match page bg usually
            }
        ]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={[styles.bookListText, { color: textColor }]}>{book.label}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={subtitleColor}
        />
      </TouchableOpacity>

      {expanded && (
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
      )}
    </Animated.View>
  );
});

interface SectionData extends BibleCategory {
  data: BibleBook[];
}

export default function BookSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';

  const textColor = Colors[theme].text;
  const subtitleColor = Colors[theme].icon;

  const handleChapterSelect = useCallback((bookId: string, chapter: number) => {
    // Navigate back to Reader with params
    router.dismiss(); 
    router.replace({
        pathname: '/(tabs)/reader',
        params: { book: bookId, chapter: String(chapter) }
    });
  }, [router]);

  const sections: SectionData[] = useMemo(() => BIBLE_STRUCTURE.map(category => ({
    ...category,
    data: category.books
  })), []);

  const renderSectionHeader = useCallback(({ section: { label } }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: isDark ? '#000000' : '#F2F2F7' }]}>
        <Text style={[styles.sectionTitle, { color: subtitleColor }]}>{label}</Text>
    </View>
  ), [isDark, subtitleColor]);

  const renderItem = useCallback(({ item }: { item: BibleBook }) => (
    <CollapsibleBook
        book={item}
        onChapterSelect={(chapter) => handleChapterSelect(item.id, chapter)}
        isDark={isDark}
        textColor={textColor}
        subtitleColor={subtitleColor}
    />
  ), [handleChapterSelect, isDark, textColor, subtitleColor]);

  const keyExtractor = useCallback((item: BibleBook) => item.id, []);

  return (
    <ThemedView style={styles.container}>
      {/* Configure Header Title */}
      <Stack.Screen options={{ title: 'בחר ספר' }} />
      
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false} // Clean modern look
        initialNumToRender={15}
        maxToRenderPerBatch={10}
        windowSize={10}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right', // Hebrew
  },
  bookContainer: {
    borderBottomWidth: 1,
    overflow: 'hidden',
  },
  bookListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20, 
  },
  bookListText: {
    fontSize: 18, // Slightly larger for full page
    fontWeight: '500',
    textAlign: 'right',
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    paddingTop: 0,
    paddingRight: 20, 
  },
  chapterItem: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
