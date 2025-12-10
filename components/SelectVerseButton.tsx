import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SelectVerseButtonProps {
  label?: string;
  onPress?: () => void;
}

export function SelectVerseButton({ 
  label = 'נווט', 
  onPress,
}: SelectVerseButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const textColor = Colors[theme].text;

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
      <View style={styles.container}>
        <GlassView 
          intensity={80} 
          className="rounded-full overflow-hidden border-0"
          contentClassName="px-6 py-3"
        >
          <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        </GlassView>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
  },
});
