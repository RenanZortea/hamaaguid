import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBibleChapter } from '@/hooks/useBible';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  // Fetch Genesis Chapter 1 - in a real app, these would come from navigation params or state
  const { verses, loading } = useBibleChapter('Genesis', 1);

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
        {/* Parent Text Container - nested Text flows inline like HTML spans */}
        <Text 
          style={[styles.chapterText, { color: Colors[colorScheme ?? 'light'].text }]} 
          selectable
        >
          {verses.map((verse) => (
            <React.Fragment key={verse.id}>
              {/* Verse Number (Small & Grey) */}
              <Text style={styles.verseNumber}> {verse.verse} </Text>
              
              {/* Verse Text (Regular) */}
              <Text style={styles.verseContent}>
                {verse.text}
              </Text>
            </React.Fragment>
          ))}
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
    alignItems: 'flex-end', // RTL alignment
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  chapterText: {
    fontSize: 22,
    lineHeight: 36, // Higher line height improves readability for Hebrew
    textAlign: 'right', // Align text to the right for RTL
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


