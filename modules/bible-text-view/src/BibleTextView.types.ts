import type { StyleProp, ViewStyle } from 'react-native';

export interface Verse {
  id: number;
  verse: number;
  text: string;
}

export interface BibleTextViewProps {
  verses: Verse[];
  selectedIds: number[];
  textColor?: number;
  darkMode?: boolean;
  textSize?: number;
  fontFamily?: string;
  onContentSizeChange?: (event: { nativeEvent: { width: number; height: number } }) => void;
  onVersePress?: (event: { nativeEvent: { verseId: number } }) => void;
  style?: StyleProp<ViewStyle>;
}
