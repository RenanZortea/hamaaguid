import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

interface RadialMenuProps {
  items: { label: string; id: string }[];
  onSelect: (id: string) => void;
  triggerElement: React.ReactNode;
}

const MENU_RADIUS = 120; // How far items pop out
const SELECTION_ZONE = 40; // Minimum drag distance to select

export function RadialMenu({ items, onSelect, triggerElement }: RadialMenuProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isOpen = useSharedValue(false);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);
  const activeIndex = useSharedValue(-1);

  // Calculate angle per item
  const angleStep = (2 * Math.PI) / items.length;

  // Function to call haptics from UI thread
  const triggerHaptic = () => {
    'worklet';
    runOnJS(Haptics.selectionAsync)();
  };

  const handleFinalize = () => {
    'worklet';
    if (activeIndex.value !== -1 && isOpen.value) {
      const selectedId = items[activeIndex.value].id;
      runOnJS(onSelect)(selectedId);
    }
    isOpen.value = false;
    activeIndex.value = -1;
  };

  const pan = Gesture.Pan()
    .activateAfterLongPress(400) // Wait 400ms to open menu
    .onStart((e) => {
      isOpen.value = true;
      touchX.value = 0; // Reset relative touch
      touchY.value = 0;
      triggerHaptic();
    })
    .onUpdate((e) => {
      touchX.value = e.translationX;
      touchY.value = e.translationY;

      // Calculate distance from center
      const distance = Math.sqrt(e.translationX ** 2 + e.translationY ** 2);

      if (distance > SELECTION_ZONE) {
        // Calculate angle (normalized to 0 - 2PI)
        let angle = Math.atan2(e.translationY, e.translationX);
        if (angle < 0) angle += 2 * Math.PI;

        // Determine which wedge we are in
        // We shift by half a step so the item is centered in the wedge
        let index = Math.round((angle) / angleStep);
        if (index >= items.length) index = 0;

        if (activeIndex.value !== index) {
          activeIndex.value = index;
          triggerHaptic();
        }
      } else {
        activeIndex.value = -1;
      }
    })
    .onFinalize(handleFinalize);

  // Background overlay style
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value ? 1 : 0),
    pointerEvents: isOpen.value ? 'auto' : 'none',
  }));

  return (
    <View style={styles.container}>
      {/* The invisible overlay that catches gestures when open */}
      <GestureDetector gesture={pan}>
        <View style={styles.triggerContainer}>
          {triggerElement}

          {/* The Menu Items */}
          <Animated.View style={[styles.overlay, overlayStyle]}>
             {/* Dimmed Background */}
            <View style={styles.dimmer} />
            
            {items.map((item, index) => {
              return (
                <RadialItem
                  key={item.id}
                  item={item}
                  index={index}
                  total={items.length}
                  isOpen={isOpen}
                  activeIndex={activeIndex}
                  radius={MENU_RADIUS}
                  colorScheme={colorScheme}
                />
              );
            })}
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

// Sub-component for individual items to keep logic clean
function RadialItem({ item, index, total, isOpen, activeIndex, radius, colorScheme }: any) {
  const angle = (2 * Math.PI * index) / total;
  
  const animatedStyle = useAnimatedStyle(() => {
    // Animate out from center
    const r = withSpring(isOpen.value ? radius : 0, { damping: 15 });
    
    // Convert polar to cartesian
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);

    const isActive = activeIndex.value === index;
    
    return {
      transform: [
        { translateX: x },
        { translateY: y },
        { scale: withSpring(isActive ? 1.3 : 1) }
      ],
      opacity: isOpen.value ? 1 : 0,
      zIndex: isActive ? 10 : 1,
    };
  });

  return (
    <Animated.View style={[styles.itemContainer, animatedStyle]}>
      <View style={[
        styles.circle, 
        { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }
      ]}>
        <Text style={[
          styles.itemText,
          { color: colorScheme === 'dark' ? '#fff' : '#000' }
        ]}>
          {item.label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Just a wrapper
  },
  triggerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    width: 0, 
    height: 0,
    overflow: 'visible', // Allow items to pop out
  },
  dimmer: {
    position: 'absolute',
    width: 1000, // Huge values to cover screen
    height: 1000,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 500,
  },
  itemContainer: {
    position: 'absolute',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  itemText: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
