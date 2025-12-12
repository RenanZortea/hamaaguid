import { useColorScheme } from '@/hooks/use-color-scheme';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import Animated, { LinearTransition, ZoomIn } from 'react-native-reanimated';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

interface BibleBook {
  id: string;
  label: string;
  chapters: number;
}
interface BibleCategory {
  id: string;
  label: string;
  books: BibleBook[];
}

interface BookSelectionDialogProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (bookId: string, chapter: number) => void;
  data: BibleCategory[];
}

const ChapterItem = React.memo(({ 
    chapter, 
    onSelect, 
    isDark, 
    textColor 
}: { 
    chapter: number; 
    onSelect: (chapter: number) => void; 
    isDark: boolean; 
    textColor: string; 
}) => (
    <TouchableOpacity
        style={[
            styles.chapterItem, 
            { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
        ]}
        onPress={() => onSelect(chapter)}
    >
        <Text style={[styles.chapterText, { color: textColor }]}>{chapter}</Text>
    </TouchableOpacity>
));

const CollapsibleBook = React.memo(({
  book,
  onChapterSelect,
  isDark,
  textColor,
  subtitleColor
}: {
  book: BibleBook;
  onChapterSelect: (chapter: number) => void;
  isDark: boolean;
  textColor: string;
  subtitleColor: string;
}) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const handleChapterSelect = useCallback((chapter: number) => {
    onChapterSelect(chapter);
  }, [onChapterSelect]);

  const chapters = useMemo(() => Array.from({ length: book.chapters }, (_, i) => i + 1), [book.chapters]);

  return (
    <Animated.View 
      layout={LinearTransition.duration(300)}
      style={[
        styles.bookContainer,
        { borderBottomColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }
      ]}
    >
      <TouchableOpacity
        style={[
            styles.bookListItem,
            {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF',
            }
        ]}
        onPress={toggleExpand}
        activeOpacity={0.7}
      >
        <Text style={[styles.bookListText, { color: textColor }]}>{book.label}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={subtitleColor}
        />
      </TouchableOpacity>

      {expanded && (
        <View style={styles.chapterGrid}>
           {chapters.map((chapter) => (
            <ChapterItem 
                key={chapter} 
                chapter={chapter} 
                onSelect={handleChapterSelect} 
                isDark={isDark} 
                textColor={textColor} 
            />
          ))}
        </View>
      )}
    </Animated.View>
  );
});

interface SectionData extends BibleCategory {
  data: BibleBook[];
}

export function BookSelectionDialog({ visible, onClose, onSelect, data }: BookSelectionDialogProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';

  const handleChapterSelect = useCallback((bookId: string, chapter: number) => {
    onSelect(bookId, chapter);
    onClose();
  }, [onSelect, onClose]);

  const textColor = isDark ? '#FFFFFF' : '#000000';
  const subtitleColor = isDark ? '#AAAAAA' : '#666666';

  const sections: SectionData[] = useMemo(() => data.map(category => ({
    ...category,
    data: category.books
  })), [data]);

  const renderSectionHeader = useCallback(({ section: { label } }: { section: SectionData }) => (
    <View style={[styles.sectionHeader, { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }]}>
        <Text style={[styles.sectionTitle, { color: subtitleColor }]}>{label}</Text>
    </View>
  ), [isDark, subtitleColor]);

  const renderItem = useCallback(({ item }: { item: BibleBook }) => (
    <CollapsibleBook
        book={item}
        onChapterSelect={(chapter) => handleChapterSelect(item.id, chapter)}
        isDark={isDark}
        textColor={textColor}
        subtitleColor={subtitleColor}
    />
  ), [handleChapterSelect, isDark, textColor, subtitleColor]);

  const keyExtractor = useCallback((item: BibleBook) => item.id, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
      <Animated.View
        entering={ZoomIn.duration(200)}
        style={[
          styles.dialogContainer,
          { backgroundColor: isDark ? '#1C1C1E' : '#F2F2F7' }
        ]}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <TouchableOpacity onPress={onClose} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={textColor} />
          </TouchableOpacity>

          <Text style={[styles.title, { color: textColor }]}>
            בחר ספר
          </Text>

          <View style={styles.iconButton} />
        </View>

        {/* Content */}
        <SectionList
          sections={sections}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          renderSectionHeader={renderSectionHeader}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          stickySectionHeadersEnabled={false}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
        />
      </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  content: {
    paddingBottom: 40,
  },
  sectionHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right', // Hebrew
  },
  bookContainer: {
    borderBottomWidth: 1,
    marginHorizontal: 0, 
    overflow: 'hidden', // Add overflow hidden for smooth layout transition clips
  },
  bookListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20, 
  },
  bookListText: {
    fontSize: 17,
    fontWeight: '500',
    textAlign: 'right',
  },
  chapterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
    paddingTop: 0,
    paddingRight: 20, 
  },
  chapterItem: {
    width: 48, // Squared
    height: 48, // Squared
    borderRadius: 12, // Rounded corners
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapterText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
