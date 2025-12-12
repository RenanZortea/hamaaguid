import { AnimatedSearch } from '@/components/AnimatedSearch';
import { PageTransition } from '@/components/PageTransition';
import { SelectVerseButton } from '@/components/SelectVerseButton';
import { VerseActionMenu } from '@/components/VerseActionMenu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBibleChapter } from '@/hooks/useBible';
import { SearchResult, useOramaSearch } from '@/hooks/useOramaSearch';
import { useScrollToVerse } from '@/hooks/useScrollToVerse';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import * as ClipboardAPI from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- BIBLE STRUCTURE DATA ---
// --- BIBLE STRUCTURE DATA MOVED TO constants/bibleData.ts ---

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const router = useRouter();
  const params = useLocalSearchParams();

  const [currentBook, setCurrentBook] = useState('בראשית');
  const [currentChapter, setCurrentChapter] = useState(1);
  const { verses, loading } = useBibleChapter(currentBook, currentChapter);
  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);

  // Use the scroll hook
  const { scrollViewRef, handleHeaderLayout, checkScrollToVerse } = useScrollToVerse(
    params,
    verses,
    loading
  );

  // 1. Setup Search State
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, loading: searchLoading } = useOramaSearch(searchQuery);

  // Handle Navigation Params (from Search)
  // Handle Navigation Params (from Search)
  useEffect(() => {
    if (params.book) {
      setCurrentBook(Array.isArray(params.book) ? params.book[0] : params.book);
      if (params.chapter) {
        setCurrentChapter(Number(params.chapter));
      } else {
        setCurrentChapter(1);
      }
      
      // Handle Verse Selection / Range
      if (params.highlightVerse) { // This corresponds to 'verse' in navigation
        const startVerse = Number(params.highlightVerse);
        const endVerse = params.endVerse ? Number(params.endVerse) : null;

        if (!loading && verses.length > 0) {
            // If verses are loaded, we can select immediately
            if (endVerse) {
                // Range Selection
                const idsToObject: number[] = [];
                // We need to find the ID for start and end verse. 
                // Since we don't have a direct map of VerseNum -> ID without iterating, 
                // and IDs might not be sequential numbers (they are DB IDs), we filter.
                
                // Optimized: Filter verses that are within the range
                const rangeIds = verses
                    .filter(v => v.verse >= startVerse && v.verse <= endVerse)
                    .map(v => v.id);
                
                setSelectedVerseIds(rangeIds);
            } else {
                // Single Verse Selection
                const targetVerse = verses.find(v => v.verse === startVerse);
                if (targetVerse) {
                    setSelectedVerseIds([targetVerse.id]);
                }
            }
        } else {
            // If loading, we might need a way to "pending" select. 
            // For now, let's just retry when verses change.
        }
      } else {
        setSelectedVerseIds([]); 
      }
    }
  }, [params.book, params.chapter, params.highlightVerse, params.endVerse, verses, loading]);

  // Search State
  const [searchVisible, setSearchVisible] = useState(false);



  const handleCopyVerse = async () => {
    if (selectedVerseIds.length === 0) return;
    
    // Get selected verses and sort by ID (assuming ID correlates to verse number order)
    const selectedVerses = verses
      .filter(v => selectedVerseIds.includes(v.id))
      .sort((a, b) => a.id - b.id);

    if (selectedVerses.length > 0) {
      // Format: "Book Chapter:V1,V2,V3 - Text1 Text2 Text3"
      const verseNumbers = selectedVerses.map(v => v.verse).join(',');
      const versesText = selectedVerses.map(v => v.text).join(' ');
      
      const textToCopy = `${currentBook} ${currentChapter}:${verseNumbers}\n${versesText}`;
      
      await ClipboardAPI.setStringAsync(textToCopy);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setSelectedVerseIds([]); // Close menu after copy
    }
  };

  const handleSearchSelect = (item: SearchResult) => {
    if (item.type === 'book') {
      // item.data is the book object: { id, name }
      router.setParams({
        book: item.label,
        chapter: '1',
        highlightVerse: '',
        endVerse: ''
      });
    } else {
      // item.data is the verse object: { id, book_name, chapter, verse, text, endVerse? }
      router.setParams({
        book: item.data.book_name,
        chapter: String(item.data.chapter),
        highlightVerse: String(item.data.verse),
        endVerse: item.data.endVerse ? String(item.data.endVerse) : ''
      });
    }
    setSearchVisible(false);
    setSearchQuery('');
  };

  return (
    <ThemedView style={styles.container}>
      <PageTransition>
        <SafeAreaView style={styles.container} edges={['top']}>
          
          {/* Content */}
          {loading ? (
            <ThemedView style={styles.center}>
              <ActivityIndicator size="large" color={Colors[theme].tint} />
              <ThemedText style={styles.loadingText}>טוען...</ThemedText>
            </ThemedView>
          ) : (
            <ScrollView 
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >

          {/* Header */}
          <View 
            style={styles.header}
            onLayout={handleHeaderLayout}
          >
            <ThemedText 
              type="title" 
              style={{ 
                fontSize: 28, 
                fontFamily: 'TaameyFrank-Bold', // Use the specific Bold font family
                fontWeight: 'normal',
                marginTop: 10,
              }}
            >
              {currentBook} {toHebrewNumeral(currentChapter)}
            </ThemedText>
          </View>
              <Text style={[styles.chapterText, { color: Colors[theme].text }]}>
                {verses.map((verse) => {
                  const isSelected = selectedVerseIds.includes(verse.id);
                  return (
                    <React.Fragment key={verse.id}>
                      <Text style={styles.verseNumber}> {toHebrewNumeral(verse.verse)} </Text>
                      <Text 
                        style={[
                          styles.verseContent, 
                          isSelected && { textDecorationLine: 'underline' }
                        ]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setSelectedVerseIds(prev => 
                            isSelected 
                              ? prev.filter(id => id !== verse.id)
                              : [...prev, verse.id]
                          );
                        }}
                        onLayout={(e) => checkScrollToVerse(verse.id, e.nativeEvent.layout.y)}
                        suppressHighlighting={false}
                      >
                        {verse.text}
                      </Text>
                    </React.Fragment>
                  );
                })}
              </Text>
            </ScrollView>
          )}

          {/* Floating Action Buttons */}
          
          {/* Copy Verse Menu - Shows when verse is selected */}
          <VerseActionMenu 
            visible={selectedVerseIds.length > 0}
            onCopy={handleCopyVerse}
            onClose={() => setSelectedVerseIds([])}
            selectedCount={selectedVerseIds.length}
          />

          {/* Trigger Button - Hides when verse is selected to reduce clutter */}
          {selectedVerseIds.length === 0 && (
            <View style={styles.fab}>
              <SelectVerseButton 
                label={`${currentBook} ${toHebrewNumeral(currentChapter)}`}
                onPress={() => router.push('/book-selection')}
                onLongPress={() => setSearchVisible(true)}
              />
            </View>
          )}
        </SafeAreaView>
      </PageTransition>

      {/* DIALOG */}
      {/* SEARCH OVERLAY */}
      <AnimatedSearch 
        visible={searchVisible}
        onCancel={() => {
          setSearchVisible(false);
          setSearchQuery('');
        }}
        results={searchResults}
        loading={searchLoading}
        onSearchChange={setSearchQuery}
        onSelect={handleSearchSelect}
      />
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
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    opacity: 0.6,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FAB
    paddingTop: 0,
  },
  chapterText: {
    fontSize: 28,
    lineHeight: 48,
    fontFamily: 'TaameyFrank',
  },
  verseNumber: {
    fontSize: 18,
    color: '#888',
    marginHorizontal: 4,
    fontFamily: 'TaameyFrank-Bold',
  },
  verseContent: {
    fontSize: 28,
    lineHeight: 48,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    zIndex: 50,
  },
});
