import { ThemedView } from '@/components/themed-view';
import { BIBLE_STRUCTURE } from '@/constants/bibleData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

const NUM_COLUMNS = 4;
const GAP = 10;
const PADDING = 16;

const ChapterItem = React.memo(({ 
    chapter, 
    size, 
    isDark, 
    textColor,
    onPress 
}: { 
    chapter: number; 
    size: number; 
    isDark: boolean;
    textColor: string;
    onPress: () => void;
}) => {
    return (
        <Pressable onPress={onPress} style={{ width: size, height: size }}>
            {({ pressed }) => (
                <View style={[
                    styles.chapterItem,
                    {
                        backgroundColor: isDark 
                            ? (pressed ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)')
                            : (pressed ? 'rgba(0,0,0,0.06)' : '#FFFFFF'),
                        borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
                    }
                ]}>
                    <Text style={[styles.chapterText, { color: textColor }]}>
                        {toHebrewNumeral(chapter)}
                    </Text>
                </View>
            )}
        </Pressable>
    );
});

export default function ChapterSelectionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const bookId = Array.isArray(params.bookId) ? params.bookId[0] : params.bookId;
    const { width: screenWidth } = useWindowDimensions();

    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';
    const textColor = Colors[theme].text;

    const itemSize = Math.floor((screenWidth - PADDING * 2 - GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

    const bookData = useMemo(() => {
        for (const category of BIBLE_STRUCTURE) {
            const found = category.books.find(b => b.id === bookId);
            if (found) return found;
        }
        return null;
    }, [bookId]);

    const chapters = useMemo(() => {
        if (!bookData) return [];
        return Array.from({ length: bookData.chapters }, (_, i) => i + 1);
    }, [bookData]);

    const rows = useMemo(() => {
        const result: number[][] = [];
        for (let i = 0; i < chapters.length; i += NUM_COLUMNS) {
            result.push(chapters.slice(i, i + NUM_COLUMNS));
        }
        return result;
    }, [chapters]);

    const handleChapterSelect = useCallback((chapter: number) => {
        if (!bookId) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (params.selectionMode === 'true') {
            router.push({
                pathname: '/verse-selection',
                params: { bookId, chapter: String(chapter), returnTo: params.returnTo }
            });
            return;
        }

        router.dismissTo('/(tabs)/reader');
        router.replace({
            pathname: '/(tabs)/reader',
            params: { book: bookId, chapter: String(chapter) }
        });
    }, [bookId, params.selectionMode, params.returnTo, router]);

    if (!bookData) {
        return (
            <ThemedView style={styles.container}>
                <Stack.Screen options={{ title: 'שגיאה' }} />
                <View style={styles.center}>
                    <Text style={{ color: textColor }}>ספר לא נמצא</Text>
                </View>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            
            {/* Custom Header */}
            <View style={[
                styles.headerContainer, 
                { 
                    backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
                    borderBottomColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' 
                }
            ]}>
                <TouchableOpacity 
                    onPress={() => router.back()}
                    style={styles.backButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons name="arrow-forward" size={26} color={Colors[theme].text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>
                        {bookData.label}
                    </Text>
                </View>
                <View style={{ width: 26 }} />
            </View>


            {/* Chapter Grid */}
            <ScrollView 
                contentContainerStyle={[styles.content, { padding: PADDING }]} 
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionLabel, { color: Colors[theme].icon }]}>
                    בחר פרק
                </Text>
                {rows.map((row, rowIndex) => (
                    <View key={rowIndex} style={[styles.row, { gap: GAP, marginBottom: GAP }]}>
                        {row.map((chapter) => (
                            <ChapterItem
                                key={chapter}
                                chapter={chapter}
                                size={itemSize}
                                isDark={isDark}
                                textColor={textColor}
                                onPress={() => handleChapterSelect(chapter)}
                            />
                        ))}
                    </View>
                ))}
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 44 : 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    headerCenter: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    backButton: {
        padding: 4,
    },
    heroSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: PADDING,
        paddingVertical: 16,
        gap: 14,
    },
    heroContent: {
        flex: 1,
        gap: 6,
        alignItems: 'flex-start',
    },
    heroTitle: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'right',
        writingDirection: 'rtl',
    },
    chapterBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    chapterBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
    },
    content: { paddingBottom: 40 },
    row: { flexDirection: 'row', flexWrap: 'wrap' },
    chapterItem: { 
        flex: 1,
        borderRadius: 14, 
        justifyContent: 'center', 
        alignItems: 'center',
    },
    chapterText: { 
        fontSize: 22, 
        fontWeight: '700',
    }, 
});
