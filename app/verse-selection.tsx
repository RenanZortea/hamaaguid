import { ThemedView } from '@/components/themed-view';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useBibleChapter, Verse } from '@/hooks/useBible';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Platform, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const VerseItem = React.memo(({
    verse,
    onSelect,
    isDark,
    textColor,
    isSelected,
}: {
    verse: Verse;
    onSelect: (verse: Verse) => void;
    isDark: boolean;
    textColor: string;
    isSelected: boolean;
}) => {
    const handlePress = useCallback(() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onSelect(verse);
    }, [verse, onSelect]);

    const accentColor = isDark ? '#4A90D9' : '#0a7ea4';

    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => [
                styles.verseItem,
                {
                    backgroundColor: isDark 
                        ? (pressed ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)') 
                        : (pressed ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.02)'),
                    borderColor: isSelected ? accentColor : 'transparent',
                    borderWidth: isSelected ? 2 : 0,
                },
            ]}
        >
            <View style={styles.verseContent}>
                <View style={styles.verseHeader}>
                    {isSelected && (
                        <Ionicons 
                            name="checkmark-circle" 
                            size={20} 
                            color={accentColor} 
                        />
                    )}
                    <View style={[
                        styles.verseBadge, 
                        { 
                            backgroundColor: isSelected 
                                ? accentColor 
                                : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)') 
                        }
                    ]}>
                        <Text style={[
                            styles.verseNum, 
                            { color: isSelected ? '#FFFFFF' : textColor }
                        ]}>
                            {toHebrewNumeral(verse.verse)}
                        </Text>
                    </View>
                </View>
                <Text 
                    style={[styles.verseText, { color: textColor }]} 
                    numberOfLines={isSelected ? undefined : 2}
                >
                    {verse.text}
                </Text>
            </View>
        </Pressable>
    );
});

export default function VerseSelectionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const bookId = Array.isArray(params.bookId) ? params.bookId[0] : params.bookId;
    const chapter = Array.isArray(params.chapter) ? Number(params.chapter[0]) : Number(params.chapter);

    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';
    const textColor = Colors[theme].text;

    const { verses, loading } = useBibleChapter(bookId || 'בראשית', chapter || 1);
    const [selectedVerse, setSelectedVerse] = useState<number | null>(null);

    const handleVerseSelect = useCallback((verse: Verse) => {
        setSelectedVerse(verse.verse);

        setTimeout(() => {
            if (params.returnTo) {
                const returnPath = params.returnTo as string;
                router.dismissTo(returnPath as any);
                router.replace({
                    pathname: returnPath as any,
                    params: {
                        selectedBook: bookId,
                        selectedChapter: String(chapter),
                        selectedVerse: String(verse.verse),
                        selectedText: verse.text
                    }
                });
            }
        }, 100);
    }, [params.returnTo, router, bookId, chapter]);

    const renderItem = useCallback(({ item }: { item: Verse }) => (
        <VerseItem
            verse={item}
            onSelect={handleVerseSelect}
            isDark={isDark}
            textColor={textColor}
            isSelected={selectedVerse === item.verse}
        />
    ), [handleVerseSelect, isDark, textColor, selectedVerse]);

    const keyExtractor = useCallback((item: Verse) => item.id.toString(), []);

    const ListHeader = useCallback(() => (
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' }]}>
            <Text style={[styles.instruction, { color: Colors[theme].icon }]}>
                בחר פסוק
            </Text>
        </View>
    ), [isDark, theme]);

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            <View style={[styles.headerContainer, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-forward" size={26} color={Colors[theme].text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>
                    {bookId} {toHebrewNumeral(chapter)}
                </Text>
                <View style={{ width: 26 }} /> 
            </View>

            {loading ? (
                <View style={styles.center}>
                    <ActivityIndicator size="large" color={Colors[theme].tint} />
                </View>
            ) : (
                <FlatList
                    data={verses}
                    keyExtractor={keyExtractor}
                    renderItem={renderItem}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    ListHeaderComponent={ListHeader}
                    initialNumToRender={15}
                    maxToRenderPerBatch={15}
                    windowSize={7}
                />
            )}
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row', // RTL: Starts Right
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 40 : 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        marginBottom: 8,
        borderBottomWidth: 1,
    },
    instruction: {
        fontSize: 14,
        fontWeight: '500',
        textAlign: 'right',
        width: '100%',
    },
    content: {
        padding: 16,
        paddingBottom: 40,
    },
    verseItem: {
        marginBottom: 10,
        padding: 14,
        borderRadius: 12,
    },
    verseContent: {
        flex: 1,
    },
    verseHeader: {
        flexDirection: 'row-reverse', // In RTL, this becomes LTR visual (L->R).
        justifyContent: 'flex-start', // Start of L->R is Left.
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    verseBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    verseNum: {
        fontWeight: '600',
        fontSize: 13,
    },
    verseText: {
        fontSize: 17,
        fontFamily: 'TaameyFrank',
        textAlign: 'right',
        lineHeight: 26,
    },
});
