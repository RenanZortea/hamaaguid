import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBibleChapter, Verse } from '@/hooks/useBible';
import React, { useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  const { verses, loading } = useBibleChapter('Genesis', 1);
  const [selectedVerseId, setSelectedVerseId] = useState<number | null>(null);

  const handleVersePress = (verse: Verse) => {
    if (selectedVerseId === verse.id) {
      setSelectedVerseId(null);
    } else {
      setSelectedVerseId(verse.id);
      console.log(`Clicked verse ${verse.verse}: ${verse.text}`);
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.center}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
        <ThemedText style={styles.loadingText}>טוען...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">בראשית א</ThemedText>
      </View>
      
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
      
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
        onPress={() => alert('Select Verse')}
      >
        <IconSymbol name="book.fill" size={24} color="#fff" />
        <Text style={styles.fabText}>בחר פסוק</Text>
      </TouchableOpacity>
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
    textAlign: 'right',
    writingDirection: 'rtl',
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
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  fabText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
});



