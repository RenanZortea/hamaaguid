import { GlassView } from '@/components/ui/GlassView';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface SelectVerseButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

export function SelectVerseButton({ onPress, style }: SelectVerseButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const iconColor = Colors[theme].text;
  const textColor = Colors[theme].text;

  return (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.container, style]} 
      activeOpacity={0.8}
    >
      <GlassView 
        intensity={80} 
        className="rounded-full overflow-hidden"
      >
        <View style={styles.content}>
          <IconSymbol name="book.fill" size={24} color={iconColor} />
          <Text style={[styles.text, { color: textColor }]}>בחר פסוק</Text>
        </View>
      </GlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8, // Adding some horizontal padding on top of GlassView's p-4 if needed, but p-4 is 1rem=16px.
    // GlassView bas inner padding p-4.
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
  },
});
