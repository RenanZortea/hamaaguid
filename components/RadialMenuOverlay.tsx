import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import Animated, {
    SharedValue,
    useAnimatedStyle,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_RADIUS = 120;
const ITEM_SIZE = 60;

interface RadialMenuOverlayProps {
  isOpen: SharedValue<boolean>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  activeIndex: SharedValue<number>;
  items: { label: string; id: string }[];
  origin: SharedValue<{ x: number; y: number }>;
}

export function RadialMenuOverlay({ isOpen, touchX, touchY, activeIndex, items, origin }: RadialMenuOverlayProps) {
  const colorScheme = useColorScheme() ?? 'light';

  // 1. Dark Background Fader
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value ? 1 : 0),
    pointerEvents: isOpen.value ? 'auto' : 'none',
  }));

  // 2. Line Connector from Finger to Center
  const lineStyle = useAnimatedStyle(() => {
    if (!isOpen.value) return { opacity: 0 };
    // Calculate length from origin to current touch
    const dx = touchX.value;
    const dy = touchY.value;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);

    return {
      opacity: 1,
      width: dist,
      transform: [
        { translateX: origin.value.x },
        { translateY: origin.value.y },
        { rotate: `${angle}rad` },
        { translateX: dist / 2 }, // Offset to pivot from start
      ],
    };
  });

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      <View style={styles.dimmer} />

      {/* The Connector Line */}
      {/* <Animated.View style={[styles.line, lineStyle]} /> */}

      {/* The Menu Items centered at the Origin */}
      {items.map((item, index) => (
        <RadialItem
          key={item.id}
          item={item}
          index={index}
          total={items.length}
          isOpen={isOpen}
          activeIndex={activeIndex}
          origin={origin}
          colorScheme={colorScheme}
        />
      ))}
    </Animated.View>
  );
}

function RadialItem({ item, index, total, isOpen, activeIndex, origin, colorScheme }: any) {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2; // Start from top

  const animatedStyle = useAnimatedStyle(() => {
    const r = withSpring(isOpen.value ? MENU_RADIUS : 0, { damping: 12 });
    // Calculate absolute position based on Origin + Radius
    const x = origin.value.x + r * Math.cos(angle);
    const y = origin.value.y + r * Math.sin(angle);

    const isActive = activeIndex.value === index;

    return {
      position: 'absolute',
      left: 0, 
      top: 0,
      transform: [
        { translateX: x - ITEM_SIZE / 2 },
        { translateY: y - ITEM_SIZE / 2 },
        { scale: withSpring(isActive ? 1.3 : 1) }
      ],
      opacity: isOpen.value ? 1 : 0,
      zIndex: isActive ? 10 : 1,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      <View style={[styles.circle, { backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }]}>
        <Text style={[styles.text, { color: colorScheme === 'dark' ? '#fff' : '#000' }]}>
          {item.label}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // Ensure it's on top
    elevation: 9999,
  },
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  circle: {
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)'
  },
  text: {
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  line: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'white',
    top: 0,
    left: 0,
  }
});
