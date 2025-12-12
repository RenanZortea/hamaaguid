
import { ThemedView } from '@/components/themed-view';
import { BIBLE_STRUCTURE, BibleBook, BibleCategory } from '@/constants/bibleData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import {
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

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
    <TouchableOpacity
        style={[
            styles.bookListItem,
            {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
            }
        ]}
        onPress={() => {
            router.push({
                pathname: '/chapter-selection',
                params: { bookId: item.id }
            });
        }}
        activeOpacity={0.7}
    >
        <Text style={[styles.bookListText, { color: textColor }]}>{item.label}</Text>
        <Ionicons
          name="chevron-back" 
          size={20}
          color={subtitleColor}
        />
    </TouchableOpacity>
  ), [router, isDark, textColor, subtitleColor]);

  const keyExtractor = useCallback((item: BibleBook) => item.id, []);

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'בחר ספר' }} />
      
      <SectionList
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
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
  bookListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1, 
  },
  bookListText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'right',
  },
});
