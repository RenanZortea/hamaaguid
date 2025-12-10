import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RadialMenu } from './RadialMenu'; // Import the new component

interface SelectVerseButtonProps {
  onChapterSelect: (bookId: string, chapter: number) => void;
  label?: string;
  currentBook?: string;
  currentChapter?: number;
}

export function SelectVerseButton({ onChapterSelect, label = 'בחר פסוק', currentBook = '', currentChapter = 1 }: SelectVerseButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const textColor = Colors[theme].text;

  // DEMO DATA: First 5 books (Torah) to test the menu
  // A real radial menu cannot hold 39 books. 
  // You would need to change this to Categories (Torah, Prophets, Writings)
  const menuItems = [
    { label: 'בראשית', id: 'בראשית' },
    { label: 'שמות', id: 'שמות' },
    { label: 'ויקרא', id: 'ויקרא' },
    { label: 'במדבר', id: 'במדבר' },
    { label: 'דברים', id: 'דברים' },
  ];

  const handleRadialSelect = (bookId: string) => {
    // Select the book and default to chapter 1
    console.log("Selected via Gesture:", bookId);
    onChapterSelect(bookId, 1);
  };

  return (
    <View style={styles.wrapper}>
      <RadialMenu 
        items={menuItems} 
        onSelect={handleRadialSelect}
        triggerElement={
          <GlassView 
            intensity={80} 
            className="rounded-full overflow-hidden border-0"
            contentClassName="px-6 py-3"
          >
            <View style={styles.content}>
              <Text style={[styles.text, { color: textColor }]}>
                {label} (Hold me)
              </Text>
            </View>
          </GlassView>
        }
      />
    </View>
  );
}


const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    zIndex: 100, // Ensure it's above other content
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});

