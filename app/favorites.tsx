import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { FavoriteVerse, useFavorites } from '@/contexts/FavoritesContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import { router, Stack } from 'expo-router';
import { Trash2 } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

export default function FavoritesScreen() {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const { favorites, loading, removeFromFavorites } = useFavorites();

  const handlePress = (item: FavoriteVerse) => {
    // Navigate to reader
    // We want to highlight the verses
    // For range we take first and last
    if (!item.verseNumbers || item.verseNumbers.length === 0) return;
    
    const startVerse = item.verseNumbers[0];
    const endVerse = item.verseNumbers.length > 1 ? item.verseNumbers[item.verseNumbers.length - 1] : undefined;
    
    router.push({
        pathname: '/(tabs)/reader',
        params: {
            book: item.book,
            chapter: String(item.chapter),
            highlightVerse: String(startVerse),
            endVerse: endVerse ? String(endVerse) : '',
        }
    });
  };

  const renderItem = ({ item }: { item: FavoriteVerse }) => {
    return (
      <TouchableOpacity 
        style={[styles.card, { backgroundColor: colorScheme === 'dark' ? '#1c1c1e' : '#ffffff' }]}
        activeOpacity={0.7}
        onPress={() => handlePress(item)}
      >
        <View style={styles.cardHeader}>
             <ThemedText style={styles.cardTitle}>
                {item.book} {toHebrewNumeral(item.chapter)}
                {item.verseNumbers && item.verseNumbers.length > 0 
                  ? `:${toHebrewNumeral(item.verseNumbers[0])}` 
                  : ''}
                {item.verseNumbers && item.verseNumbers.length > 1 
                  ? `-${toHebrewNumeral(item.verseNumbers[item.verseNumbers.length - 1])}` 
                  : ''}
             </ThemedText>
             
             <TouchableOpacity 
                onPress={() => removeFromFavorites(item.id)}
                hitSlop={10}
                style={{ padding: 4 }}
             >
                <Trash2 size={18} color="#FF3B30" opacity={0.8} />
             </TouchableOpacity>
        </View>

        {item.previewText && (
            <ThemedText 
                numberOfLines={2} 
                style={[styles.previewText, { color: Colors[theme].icon }]}
            >
                {item.previewText}
            </ThemedText>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{
            title: 'מועדפים',
            headerShown: true,
            headerBackTitle: 'חזרה',
            headerStyle: { backgroundColor: Colors[theme].background },
            headerTintColor: Colors[theme].text,
        }} 
      />
      
        {loading ? (
            <View style={styles.center}>
                <ActivityIndicator size="large" color={Colors[theme].tint} />
            </View>
        ) : favorites.length === 0 ? (
            <View style={styles.center}>
                <HeartEmptyState theme={theme} />
            </View>
        ) : (
            <FlatList
                data={favorites}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        )}
    </ThemedView>
  );
}

function HeartEmptyState({ theme }: { theme: 'light' | 'dark' }) {
    return (
        <View style={{ alignItems: 'center', opacity: 0.5 }}>
            <Trash2 size={48} color={Colors[theme].text} style={{ display: 'none' }} /> 
            {/* Using a placeholder text since we might not have a big Heart icon handy, standard text is fine */}
            <ThemedText type="subtitle">אין עדיין מועדפים</ThemedText>
            <ThemedText style={{ marginTop: 8 }}>פסוקים שתשמור יופיעו כאן</ThemedText>
        </View>
    )
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
  listContent: {
    padding: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'TaameyFrank-Bold',
  },
  previewText: {
    fontSize: 16,
    fontFamily: 'TaameyFrank',
    lineHeight: 24,
  }
});
