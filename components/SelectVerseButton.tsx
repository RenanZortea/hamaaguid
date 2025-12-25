import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';

interface SelectVerseButtonProps {
  label?: string;
  onPress?: () => void;
  onLongPress?: () => void;
}

export function SelectVerseButton({ 
  label = 'נווט', 
  onPress,
  onLongPress,
}: SelectVerseButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const textColor = Colors[theme].text;

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress?.();
  };

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  return (
    <TouchableOpacity onPress={handlePress} onLongPress={handleLongPress} activeOpacity={0.8}>
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
