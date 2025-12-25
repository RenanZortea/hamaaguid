import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { toHebrewNumeral } from '@/utils/hebrewNumerals';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';

interface AnimatedVerseProps {
  verse: {
    id: number;
    verse: number;
    text: string;
  };
  isSelected: boolean;
  isDimmed: boolean;
  onPress: () => void;
  baseStyle?: TextStyle;
}

export function AnimatedVerse({ verse, isSelected, isDimmed, onPress, baseStyle }: AnimatedVerseProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  // Simple color values - no animation for better performance
  const normalTextColor = Colors[theme].text;
  const dimmedTextColor = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  const normalNumberColor = '#888';
  const dimmedNumberColor = theme === 'dark' ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)';
  
  const textColor = isDimmed ? dimmedTextColor : normalTextColor;
  const numberColor = isDimmed ? dimmedNumberColor : normalNumberColor;
  
  return (
    <>
      <Text style={[styles.verseNumber, { color: numberColor }]}>
        {' '}{toHebrewNumeral(verse.verse)}
      </Text>
      <Text 
        style={[styles.verseContent, baseStyle, { color: textColor }]}
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        suppressHighlighting={false}
      >
        {verse.text}
      </Text>
    </>
  );
}

const styles = StyleSheet.create({
  verseNumber: {
    fontSize: 18,
    fontFamily: 'TaameyFrank-Bold',
  },
  verseContent: {
    fontSize: 28,
    lineHeight: 48,
  },
});
