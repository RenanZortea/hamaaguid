import { AnimatedSearch } from '@/components/AnimatedSearch';
import { BookSelectionDialog } from '@/components/BookSelectionDialog';
import { SelectVerseButton } from '@/components/SelectVerseButton';
import { VerseActionMenu } from '@/components/VerseActionMenu';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBibleChapter } from '@/hooks/useBible';
import * as ClipboardAPI from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface BibleBook {
  id: string;
  label: string;
  chapters: number;
}
export interface BibleCategory {
  id: string;
  label: string;
  books: BibleBook[];
}

// --- BIBLE STRUCTURE DATA ---
const BIBLE_STRUCTURE: BibleCategory[] = [
  {
    id: 'Torah',
    label: 'תורה',
    books: [
      { id: 'בראשית', label: 'בראשית', chapters: 50 },
      { id: 'שמות', label: 'שמות', chapters: 40 },
      { id: 'ויקרא', label: 'ויקרא', chapters: 27 },
      { id: 'במדבר', label: 'במדבר', chapters: 36 },
      { id: 'דברים', label: 'דברים', chapters: 34 },
    ],
  },
  {
    id: 'Neviim',
    label: 'נביאים',
    books: [
      { id: 'יהושע', label: 'יהושע', chapters: 24 },
      { id: 'שופטים', label: 'שופטים', chapters: 21 },
      { id: 'שמואל א', label: 'שמואל א', chapters: 31 },
      { id: 'שמואל ב', label: 'שמואל ב', chapters: 24 },
      { id: 'מלכים א', label: 'מלכים א', chapters: 22 },
      { id: 'מלכים ב', label: 'מלכים ב', chapters: 25 },
      { id: 'ישעיהו', label: 'ישעיהו', chapters: 66 },
      { id: 'ירמיהו', label: 'ירמיהו', chapters: 52 },
      { id: 'יחזקאל', label: 'יחזקאל', chapters: 48 },
      { id: 'הושע', label: 'הושע', chapters: 14 },
      { id: 'יואל', label: 'יואל', chapters: 4 },
      { id: 'עמוס', label: 'עמוס', chapters: 9 },
      { id: 'עובדיה', label: 'עובדיה', chapters: 1 },
      { id: 'יונה', label: 'יונה', chapters: 4 },
      { id: 'מיכה', label: 'מיכה', chapters: 7 },
      { id: 'נחום', label: 'נחום', chapters: 3 },
      { id: 'חבקוק', label: 'חבקוק', chapters: 3 },
      { id: 'צפניה', label: 'צפניה', chapters: 3 },
      { id: 'חגי', label: 'חגי', chapters: 2 },
      { id: 'זכריה', label: 'זכריה', chapters: 14 },
      { id: 'מלאכי', label: 'מלאכי', chapters: 3 },
    ],
  },

  {
    id: 'Ketuvim',
    label: 'כתובים',
    books: [
      { id: 'תהילים', label: 'תהילים', chapters: 150 },
      { id: 'משלי', label: 'משלי', chapters: 31 },
      { id: 'איוב', label: 'איוב', chapters: 42 },
      { id: 'שיר השירים', label: 'שיר השירים', chapters: 8 },
      { id: 'רות', label: 'רות', chapters: 4 },
      { id: 'איכה', label: 'איכה', chapters: 5 },
      { id: 'קהלת', label: 'קהלת', chapters: 12 },
      { id: 'אסתר', label: 'אסתר', chapters: 10 },
      { id: 'דניאל', label: 'דניאל', chapters: 12 },
      { id: 'עזרא', label: 'עזרא', chapters: 10 },
      { id: 'נחמיה', label: 'נחמיה', chapters: 13 },
      { id: 'דברי הימים א', label: 'דברי הימים א', chapters: 29 },
      { id: 'דברי הימים ב', label: 'דברי הימים ב', chapters: 36 },
    ],
  },
  {
    id: 'BritChadasha',
    label: 'הברית החדשה',
    books: [
      { id: 'מתי', label: 'מתי', chapters: 28 },
      { id: 'מרקוס', label: 'מרקוס', chapters: 16 },
      { id: 'לוקס', label: 'לוקס', chapters: 24 },
      { id: 'יוחנן', label: 'יוחנן', chapters: 21 },
      { id: 'מעשים', label: 'מעשים', chapters: 28 },
      { id: 'רומים', label: 'רומים', chapters: 16 },
      { id: '1 קורינתיים', label: '1 קורינתיים', chapters: 16 },
      { id: '2 קורינתיים', label: '2 קורינתיים', chapters: 13 },
      { id: 'גלטים', label: 'גלטים', chapters: 6 },
      { id: 'אפסים', label: 'אפסים', chapters: 6 },
      { id: 'פיליפים', label: 'פיליפים', chapters: 4 },
      { id: 'קולוסים', label: 'קולוסים', chapters: 4 },
      { id: '1 Thessalonikians', label: '1 תסלוניקים', chapters: 5 },
      { id: '2 Thessalonikians', label: '2 תסלוניקים', chapters: 3 },
      { id: '1 טימותיאוס', label: '1 טימותיאוס', chapters: 6 },
      { id: '2 טימותיאוס', label: '2 טימותיאוס', chapters: 4 },
      { id: 'תיטוס', label: 'תיטוס', chapters: 3 },
      { id: 'פילימון', label: 'פילימון', chapters: 1 },
      { id: 'הברית החדשה', label: 'עברים', chapters: 13 },
      { id: 'יעקב', label: 'יעקב', chapters: 5 },
      { id: '1 פטרוס', label: '1 פטרוס', chapters: 5 },
      { id: '2 פטרוס', label: '2 פטרוס', chapters: 3 },
      { id: '1 יוחנן', label: '1 יוחנן', chapters: 5 },
      { id: '2 יוחנן', label: '2 יוחנן', chapters: 1 },
      { id: '3 יוחנן', label: '3 יוחנן', chapters: 1 },
      { id: 'יהודה', label: 'יהודה', chapters: 1 },
      { id: 'התגלות', label: 'התגלות', chapters: 22 },
    ],
  }
];

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const [currentBook, setCurrentBook] = useState('בראשית');
  const [currentChapter, setCurrentChapter] = useState(1);
  const { verses, loading } = useBibleChapter(currentBook, currentChapter);
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);

  // Search State
  const [searchVisible, setSearchVisible] = useState(false);

  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleMenuSelect = (bookId: string, chapter: number) => {
    setCurrentBook(bookId);
    setCurrentChapter(chapter);
    setSelectedVerseId(null);
    setIsDialogOpen(false);
  };

  const handleCopyVerse = async () => {
    if (!selectedVerseId) return;
    
    const verse = verses.find(v => v.id === selectedVerseId);
    if (verse) {
      // Format: "Book Chapter:Verse - Text"
      const textToCopy = `${currentBook} ${currentChapter}:${verse.verse}\n${verse.text}`;
      await ClipboardAPI.setStringAsync(textToCopy);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      setSelectedVerseId(null); // Close menu after copy
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title" style={{ fontSize: 24 }}>
            {currentBook} {currentChapter}
          </ThemedText>
        </View>
        
        {/* Content */}
        {loading ? (
          <ThemedView style={styles.center}>
            <ActivityIndicator size="large" color={Colors[theme].tint} />
            <ThemedText style={styles.loadingText}>טוען...</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={[styles.chapterText, { color: Colors[theme].text }]}>
              {verses.map((verse) => {
                const isSelected = selectedVerseId === verse.id;
                return (
                  <React.Fragment key={verse.id}>
                    <Text style={styles.verseNumber}> {verse.verse} </Text>
                    <Text 
                      style={[
                        styles.verseContent, 
                        isSelected && { backgroundColor: theme === 'dark' ? '#554b2e' : '#fff3cd', color: theme === 'dark' ? '#fff' : '#000' }
                      ]}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedVerseId(isSelected ? null : verse.id);
                      }}
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
          visible={selectedVerseId !== null}
          onCopy={handleCopyVerse}
          onClose={() => setSelectedVerseId(null)}
        />

        {/* Trigger Button - Hides when verse is selected to reduce clutter */}
        {selectedVerseId === null && (
          <View style={styles.fab}>
            <SelectVerseButton 
              label="נווט"
              onPress={() => setIsDialogOpen(true)}
              onLongPress={() => setSearchVisible(true)}
            />
          </View>
        )}
      </SafeAreaView>

      {/* DIALOG */}
      <BookSelectionDialog
        visible={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSelect={handleMenuSelect}
        data={BIBLE_STRUCTURE}
      />
      
      {/* SEARCH OVERLAY */}
      <AnimatedSearch 
        visible={searchVisible}
        data={[
          { id: '1', label: 'Genesis', subLabel: 'The Beginning' },
          { id: '2', label: 'Exodus', subLabel: 'Departure' },
          { id: '3', label: 'Leviticus', subLabel: 'Laws' },
          { id: '4', label: 'Numbers', subLabel: 'Census' },
          { id: '5', label: 'Deuteronomy', subLabel: 'Second Law' },
        ]}
        onSelect={(item) => setSearchVisible(false)}
        onCancel={() => setSearchVisible(false)}
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
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right', // Align text to the right for Hebrew
    writingDirection: 'rtl',
    fontFamily: 'System', // Or your custom Hebrew font
  },
  verseNumber: {
    fontSize: 14,
    color: '#888',
    fontWeight: '700',
    marginHorizontal: 4,
  },
  verseContent: {
    // Tappable areas logic
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    zIndex: 50,
  },
});