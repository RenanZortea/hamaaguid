import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS, SharedValue } from 'react-native-reanimated';

interface SelectVerseButtonProps {
  label?: string;
  // Shared values passed down from parent
  isOpen: SharedValue<boolean>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  origin: SharedValue<{ x: number; y: number }>;
  activeIndex: SharedValue<number>;
  onFinalSelect: () => void;
  totalItems?: number;
}

export function SelectVerseButton({ 
  label = 'בחר פסוק', 
  isOpen, 
  touchX, 
  touchY, 
  origin, 
  activeIndex, 
  onFinalSelect,
  totalItems = 5
}: SelectVerseButtonProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const textColor = Colors[theme].text;

  const haptic = () => {
    'worklet';
    runOnJS(Haptics.selectionAsync)();
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(300)
    .onStart((e) => {
      // Set the center of the menu to where the finger started
      origin.value = { x: e.absoluteX, y: e.absoluteY - 50 }; // -50 to see it above finger
      isOpen.value = true;
      haptic();
    })
    .onUpdate((e) => {
      touchX.value = e.translationX;
      touchY.value = e.translationY;
      

    })
    .onFinalize(() => {
      if (isOpen.value && activeIndex.value !== -1) {
        runOnJS(onFinalSelect)();
      }
      isOpen.value = false;
      activeIndex.value = -1;
    });

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.container}>
        <GlassView 
          intensity={80} 
          className="rounded-full overflow-hidden border-0"
          contentClassName="px-6 py-3"
        >
          <Text style={[styles.text, { color: textColor }]}>{label}</Text>
        </GlassView>
      </View>
    </GestureDetector>
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
