import { ThemedView } from '@/components/themed-view';
import { BIBLE_STRUCTURE, BibleBook, BibleCategory } from '@/constants/bibleData';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useMemo } from 'react';
import { Platform, Pressable, SectionList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SectionData extends BibleCategory {
    data: BibleBook[];
}

const BookItem = React.memo(({ 
    item, 
    onPress, 
    isDark, 
    textColor, 
    subtitleColor 
}: { 
    item: BibleBook; 
    onPress: () => void; 
    isDark: boolean; 
    textColor: string; 
    subtitleColor: string;
}) => {
    return (
        <Pressable onPress={onPress}>
            {({ pressed }) => (
                <View style={[
                    styles.bookCard,
                    {
                        backgroundColor: isDark 
                            ? (pressed ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)')
                            : (pressed ? 'rgba(0,0,0,0.04)' : '#FFFFFF'),
                        borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    }
                ]}>
                    <View style={styles.bookContent}>
                        <Text style={[styles.bookTitle, { color: textColor }]} numberOfLines={1}>
                            {item.label}
                        </Text>
                    </View>
                    <View style={[styles.chevronContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
                        <Ionicons name="chevron-back" size={18} color={subtitleColor} />
                    </View>
                </View>
            )}
        </Pressable>
    );
});

export default function BookSelectionScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const colorScheme = useColorScheme();
    const theme = colorScheme ?? 'light';
    const isDark = theme === 'dark';

    const textColor = Colors[theme].text;
    const subtitleColor = Colors[theme].icon;

    const sections: SectionData[] = useMemo(() => BIBLE_STRUCTURE.map(category => ({
        ...category,
        data: category.books
    })), []);

    const handleBookSelect = useCallback((book: BibleBook) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/chapter-selection',
            params: {
                bookId: book.id,
                returnTo: params.returnTo,
                selectionMode: params.selectionMode,
            },
        });
    }, [router, params.returnTo, params.selectionMode]);

    const renderSectionHeader = useCallback(({ section }: { section: SectionData }) => {
        return (
            <View style={[
                styles.sectionHeader, 
                { 
                    backgroundColor: isDark ? 'rgba(21, 23, 24, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                }
            ]}>
                <View style={[styles.sectionPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)' }]}>
                    <Text style={[styles.sectionTitle, { color: textColor }]}>{section.label}</Text>
                </View>
                <View style={[styles.sectionLine, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' }]} />
            </View>
        );
    }, [isDark, textColor]);

    const renderItem = useCallback(({ item }: { item: BibleBook }) => (
        <BookItem
            item={item}
            onPress={() => handleBookSelect(item)}
            isDark={isDark}
            textColor={textColor}
            subtitleColor={subtitleColor}
        />
    ), [isDark, textColor, subtitleColor, handleBookSelect]);

    const keyExtractor = useCallback((item: BibleBook) => item.id, []);

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
                <View style={styles.headerTitleContainer}>
                    <Text style={[styles.headerTitle, { color: Colors[theme].text }]}>
                        בחר ספר
                    </Text>
                    <Text style={[styles.headerSubtitle, { color: subtitleColor }]}>
                        התנ״ך הקדוש
                    </Text>
                </View>
                <View style={{ width: 26 }} />
            </View>

            <SectionList
                sections={sections}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                renderSectionHeader={renderSectionHeader}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
                stickySectionHeadersEnabled={true}
                initialNumToRender={20}
                maxToRenderPerBatch={20}
                windowSize={11}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: Platform.OS === 'android' ? 44 : 16,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        padding: 4,
    },
    headerTitleContainer: {
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 13,
        marginTop: 2,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 40,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 4,
        gap: 12,
    },
    sectionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '600',
    },
    sectionLine: {
        flex: 1,
        height: 2,
        borderRadius: 1,
    },
    bookCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 4,
        padding: 14,
        borderRadius: 16,
        borderWidth: 1,
        gap: 12,
    },
    bookContent: {
        flex: 1,
        minWidth: 0,
    },
    bookTitle: {
        fontSize: 17,
        fontWeight: '600',
    },
    bookChapters: {
        fontSize: 13,
        marginTop: 2,
    },
    chevronContainer: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
