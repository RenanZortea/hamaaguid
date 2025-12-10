import { RadialMenuOverlay } from '@/components/RadialMenuOverlay';
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

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  const [currentBook, setCurrentBook] = useState('בראשית');
  const [currentChapter, setCurrentChapter] = useState(1);
  const { verses, loading } = useBibleChapter(currentBook, currentChapter);
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);

  // Animation State for Radial Menu
  const isOpen = useSharedValue(false);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const origin = useSharedValue({ x: 0, y: 0 });
  const activeIndex = useSharedValue(-1);

  // Menu Items (Torah)
  const menuItems = [
    { label: 'בראשית', id: 'בראשית' },
    { label: 'שמות', id: 'שמות' },
    { label: 'ויקרא', id: 'ויקרא' },
    { label: 'במדבר', id: 'במדבר' },
    { label: 'דברים', id: 'דברים' },
  ];

  const handleVersePress = (verse: Verse) => {
    if (selectedVerseId === verse.id) {
      setSelectedVerseId(null);
    } else {
      setSelectedVerseId(verse.id);
      console.log(`Clicked verse ${verse.verse}: ${verse.text}`);
    }
  };

  const handleRadialSelect = () => {
    const idx = activeIndex.value;
    if (idx >= 0 && idx < menuItems.length) {
      const selected = menuItems[idx];
      console.log("Selected:", selected.id);
      setCurrentBook(selected.id);
      setCurrentChapter(1); // Reset to chapter 1
      setSelectedVerseId(null); // Reset selection on change
    }
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
                    {/* Verse Number - NOT clickable */}
                    <Text style={styles.verseNumber}> {verse.verse} </Text>
                    
                    {/* Verse Text - CLICKABLE */}
                    <Text 
                      style={[
                        styles.verseContent, 
                        isSelected && styles.selectedVerse
                      ]}
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

        {/* The Button (Pass shared values) */}
        <View style={styles.fab}>
          <SelectVerseButton 
            label={`${currentBook} ${currentChapter}`}
            isOpen={isOpen}
            touchX={touchX}
            touchY={touchY}
            origin={origin}
            activeIndex={activeIndex}
            onFinalSelect={handleRadialSelect}
            totalItems={menuItems.length}
          />
        </View>
      </SafeAreaView>

      {/* The Overlay (Must be last to be on top) */}
      <RadialMenuOverlay 
        isOpen={isOpen}
        touchX={touchX}
        touchY={touchY}
        origin={origin}
        activeIndex={activeIndex}
        items={menuItems}
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
