import { BibleCategory, GestureMenuOverlay } from '@/components/GestureMenuOverlay';
import { SelectVerseButton } from '@/components/SelectVerseButton';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBibleChapter, Verse } from '@/hooks/useBible';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- DATA STRUCTURE (Complete Bible) ---
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
  }
];

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  const [currentBook, setCurrentBook] = useState('בראשית');
  const [currentChapter, setCurrentChapter] = useState(1);
  const { verses, loading } = useBibleChapter(currentBook, currentChapter);
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);

  // Animation State
  const isOpen = useSharedValue(false);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const origin = useSharedValue({ x: 0, y: 0 });

  const handleVersePress = (verse: Verse) => {
    if (selectedVerseId === verse.id) {
      setSelectedVerseId(null);
    } else {
      setSelectedVerseId(verse.id);
    }
  };

  const handleMenuSelect = (bookId: string, chapter: number) => {
    console.log("Selected:", bookId, chapter);
    setCurrentBook(bookId);
    setCurrentChapter(chapter);
    setSelectedVerseId(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <ThemedText type="title">{currentBook} {currentChapter}</ThemedText>
        </View>
        
        {loading ? (
          <ThemedView style={styles.center}>
            <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
            <ThemedText style={styles.loadingText}>טוען...</ThemedText>
          </ThemedView>
        ) : (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={[styles.chapterText, { color: Colors[colorScheme ?? 'light'].text }]}>
              {verses.map((verse) => {
                const isSelected = selectedVerseId === verse.id;
                return (
                  <React.Fragment key={verse.id}>
                    <Text style={styles.verseNumber}> {verse.verse} </Text>
                    <Text 
                      style={[styles.verseContent, isSelected && styles.selectedVerse]}
                      onPress={() => handleVersePress(verse)}
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

        {/* Floating Trigger Button */}
        <View style={styles.fab}>
          <SelectVerseButton 
            label={`${currentBook} ${currentChapter}`}
            isOpen={isOpen}
            touchX={touchX}
            touchY={touchY}
            origin={origin}
            activeIndex={useSharedValue(-1)} // Not used in new menu, pass dummy
            onFinalSelect={() => {}} // Logic moved to Overlay
          />
        </View>
      </SafeAreaView>

      {/* NEW Gesture Menu Overlay */}
      <GestureMenuOverlay 
        isOpen={isOpen}
        touchX={touchX}
        touchY={touchY}
        origin={origin}
        data={BIBLE_STRUCTURE}
        onSelect={handleMenuSelect}
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
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'flex-end',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  chapterText: {
    fontSize: 22,
    lineHeight: 36,
    textAlign: 'right', // Align text to the right for Hebrew
    writingDirection: 'rtl', // Ensure RTL handling
  },
  verseNumber: {
    fontSize: 14,
    color: '#888',
    fontWeight: 'bold',
  },
  verseContent: {
    // Inherits from chapterText
  },
  selectedVerse: {
    backgroundColor: '#fff3cd', // Light yellow highlight
    color: '#000',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    zIndex: 100,
  },
});
