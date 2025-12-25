import { AnimatedSearch } from '@/components/AnimatedSearch';
import { PageTransition } from '@/components/PageTransition';
import { ReadingSettingsMenu } from '@/components/ReadingSettingsMenu';
import { SelectVerseButton } from '@/components/SelectVerseButton';
import { VerseActionMenu } from '@/components/VerseActionMenu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useBibleContext } from '@/contexts/BibleContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SearchResult, useOramaSearch } from '@/hooks/useOramaSearch';
import { useReadingSettings } from '@/hooks/useReadingSettings';
import { useScrollToVerse } from '@/hooks/useScrollToVerse';
import { BibleTextView } from '@/modules/bible-text-view';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import * as ClipboardAPI from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, processColor, StyleSheet, View } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- BIBLE STRUCTURE DATA ---
// --- BIBLE STRUCTURE DATA MOVED TO constants/bibleData.ts ---

import { PullToReveal } from '@/components/PullToReveal';

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const router = useRouter();
  const params = useLocalSearchParams();

  // Use Global Context
  const { 
    book: currentBook, 
    chapter: currentChapter, 
    verses, 
    loading, 
    setBook, 
    setChapter 
  } = useBibleContext();

  const [selectedVerseIds, setSelectedVerseIds] = useState<number[]>([]);
  
  // --- MENU HEIGHT CONSTANT ---
  const MENU_HEIGHT = 150; 

  // We no longer need offset in useScrollToVerse since the menu is overlaid/behind
  const { scrollViewRef, handleHeaderLayout, setVersePositions } = useScrollToVerse(
    params,
    verses,
    loading,
    0 // No offset needed for overlay
  );

  // Track if we are at the top to enable Pull-to-Reveal
  const [isAtTop, setIsAtTop] = useState(true);

  // 1. Setup Search State
  const [searchQuery, setSearchQuery] = useState('');
  const { results: searchResults, loading: searchLoading } = useOramaSearch(searchQuery);

  // Handle Navigation Params (from Search)
  useEffect(() => {
    if (params.book) {
      setBook(Array.isArray(params.book) ? params.book[0] : params.book);
      if (params.chapter) {
        setChapter(Number(params.chapter));
      } else {
        setChapter(1);
      }
      
      // Handle Verse Selection / Range
      if (params.highlightVerse) { // This corresponds to 'verse' in navigation
        const startVerse = Number(params.highlightVerse);
        const endVerse = params.endVerse ? Number(params.endVerse) : null;

        if (!loading && verses.length > 0) {
            // If verses are loaded, we can select immediately
            if (endVerse) {
                // Range Selection
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
        }
      } else {
        setSelectedVerseIds([]); 
      }
    }
  }, [params.book, params.chapter, params.highlightVerse, params.endVerse, verses, loading, setBook, setChapter]);

  // Search State
  const [searchVisible, setSearchVisible] = useState(false);

  const handleCopyVerse = async () => {
    if (selectedVerseIds.length === 0) return;
    
    // Get selected verses and sort by ID
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
      router.setParams({
        book: item.label,
        chapter: '1',
        highlightVerse: '',
        endVerse: ''
      });
    } else {
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

  // Favorites Logic
  const { isFavorite, addToFavorites, removeFromFavorites, favorites } = useFavorites();
  
  // Helper to get verse numbers from selection
  const selectedVerseNumbers = React.useMemo(() => {
    return verses
        .filter(v => selectedVerseIds.includes(v.id))
        .map(v => v.verse)
        .sort((a, b) => a - b);
  }, [selectedVerseIds, verses]);

  // Check if current selection is already saved
  const isCurrentSelectionFavorite = React.useMemo(() => {
    if (selectedVerseNumbers.length === 0) return false;
    return isFavorite(currentBook, currentChapter, selectedVerseNumbers);
  }, [selectedVerseNumbers, currentBook, currentChapter, favorites, isFavorite]);

  const handleFavoriteVerse = async () => {
    if (selectedVerseIds.length === 0) return;

    if (isCurrentSelectionFavorite) {
        const docId = `${currentBook}_${currentChapter}_${selectedVerseNumbers.join('-')}`;
        await removeFromFavorites(docId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
        const selectedVerses = verses
            .filter(v => selectedVerseIds.includes(v.id))
            .sort((a, b) => a.id - b.id); 
        const previewText = selectedVerses.map(v => v.text).join(' ');

        await addToFavorites(currentBook, currentChapter, selectedVerseNumbers, previewText);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setSelectedVerseIds([]);
  };

  const { 
    settings, 
    setFontSize, 
    setFontFamily,
  } = useReadingSettings();

  return (
    <ThemedView style={styles.container}>
      <PageTransition>
        <SafeAreaView style={styles.container} edges={['top']}>
          
          {loading ? (
            <ThemedView style={styles.center}>
              <ActivityIndicator size="large" color={Colors[theme].tint} />
              <ThemedText style={styles.loadingText}>טוען...</ThemedText>
            </ThemedView>
          ) : (
            <PullToReveal
               isAtTop={isAtTop}
               menuHeight={MENU_HEIGHT}
               simultaneousHandlers={scrollViewRef} // Connect ScrollView
               backgroundColor={Colors[theme].background} // Connect Theme
               menu={
                  <ReadingSettingsMenu 
                    visible={true}
                    settings={settings}
                    setFontSize={setFontSize}
                    setFontFamily={setFontFamily}
                  />
               }
            >
                <ScrollView 
                  ref={scrollViewRef}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                  overScrollMode="never" // Prevent Android glow effect stealing touch
                  bounces={false} // Prevent iOS bounce stealing touch
                  onScroll={(e) => {
                      const y = e.nativeEvent.contentOffset.y;
                      setIsAtTop(y <= 0);
                  }}
                >
                  
                  {/* Header (Visual only) */}
                  <View 
                    style={styles.header}
                    onLayout={handleHeaderLayout}
                  >
                    <ThemedText 
                      type="title" 
                      style={{ 
                        fontSize: 28, 
                        fontFamily: settings.fontFamily, 
                        fontWeight: 'normal',
                        marginTop: 10,
                      }}
                    >
                      {currentBook} {toHebrewNumeral(currentChapter)}
                    </ThemedText>
                  </View>
    
                  <BibleTextView 
                    verses={verses.map(v => ({
                      id: v.id,
                      verse: v.verse,
                      text: v.text
                    }))}
                    selectedIds={selectedVerseIds}
                    textColor={processColor(Colors[theme].text) as number}
                    textSize={settings.fontSize}
                    fontFamily={settings.fontFamily}
                    darkMode={theme === 'dark'}
                    onVersePress={(event: { nativeEvent: { verseId: number } }) => {
                        // ... existing logic ...
                        const verseId = event.nativeEvent.verseId;
                        Haptics.selectionAsync();
                        setSelectedVerseIds(prev => prev.includes(verseId) ? prev.filter(id => id !== verseId) : [...prev, verseId]);
                    }}
                    style={{ width: '100%' }}
                  />
                </ScrollView>
            </PullToReveal>
          )}

          {/* FABs ... */}


          {/* Floating Action Buttons */}
          
          {/* Copy Verse Menu - Shows when verse is selected */}
          <VerseActionMenu 
            visible={selectedVerseIds.length > 0}
            onCopy={handleCopyVerse}
            onFavorite={handleFavoriteVerse}
            isFavorite={isCurrentSelectionFavorite}
            onClose={() => setSelectedVerseIds([])}
            selectedCount={selectedVerseIds.length}
          />

          {/* Trigger Button - Hides when verse is selected to reduce clutter */}
          {selectedVerseIds.length === 0 && (
            <View 
              style={styles.fab}
              onStartShouldSetResponder={() => true}
              onTouchEnd={(e) => e.stopPropagation()}
            >
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
    elevation: 50, // Higher than PullToReveal (10)
  },
});
