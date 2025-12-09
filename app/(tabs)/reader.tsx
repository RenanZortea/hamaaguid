import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBibleChapter, Verse } from '@/hooks/useBible';
import { FlashList } from '@shopify/flash-list';
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ReaderScreen() {
  const colorScheme = useColorScheme();
  // Fetch Genesis Chapter 1 - in a real app, these would come from navigation params or state
  const { verses, loading } = useBibleChapter('Genesis', 1);

  const renderItem = ({ item }: { item: Verse }) => (
    <View style={styles.verseContainer}>
      <Text style={[styles.verseNumber, { color: Colors[colorScheme ?? 'light'].text }]}>
        {item.verse}
      </Text>
      <Text 
        style={[styles.verseText, { color: Colors[colorScheme ?? 'light'].text }]} 
        selectable
      >
        {item.text}
      </Text>
    </View>
  );

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
      
      <FlashList
        data={verses}
        renderItem={renderItem}
        estimatedItemSize={100}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
      />
      
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
  listContent: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  verseContainer: {
    flexDirection: 'row-reverse', // RTL for Hebrew
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  verseNumber: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 8,
    marginTop: 6,
    width: 24,
    textAlign: 'center',
  },
  verseText: {
    flex: 1,
    fontSize: 22,
    lineHeight: 32,
    textAlign: 'right', // RTL for Hebrew
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

