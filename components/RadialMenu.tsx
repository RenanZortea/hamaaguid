import { useColorScheme } from '@/hooks/use-color-scheme';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from 'react-native-reanimated';

interface RadialMenuProps {
  items: { label: string; id: string }[];
  onSelect: (id: string) => void;
  triggerElement: React.ReactNode;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MENU_RADIUS = 100;
const ITEM_SIZE = 60;

export function RadialMenu({ items, onSelect, triggerElement }: RadialMenuProps) {
  const colorScheme = useColorScheme() ?? 'light';
  
  // State to track where the menu should open (center of screen for safety)
  const [menuPosition, setMenuPosition] = useState({ x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2 });

  const isOpen = useSharedValue(false);
  const activeIndex = useSharedValue(-1);
  const touchX = useSharedValue(0);
  const touchY = useSharedValue(0);

  const angleStep = (2 * Math.PI) / items.length;

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
    .activateAfterLongPress(300)
    .onStart((e) => {
      // Calculate where to show the menu. 
      // We want it slightly above the finger so you can see it.
      runOnJS(setMenuPosition)({ x: e.absoluteX, y: e.absoluteY - 50 });
      
      isOpen.value = true;
      touchX.value = 0;
      touchY.value = 0;
      triggerHaptic();
    })
    .onUpdate((e) => {
      touchX.value = e.translationX;
      touchY.value = e.translationY;

      const distance = Math.sqrt(e.translationX ** 2 + e.translationY ** 2);

      if (distance > 30) { // Deadzone of 30px
        let angle = Math.atan2(e.translationY, e.translationX);
        if (angle < 0) angle += 2 * Math.PI;

        // Shift angle by half a step so the item is in the "middle" of the slice
        let index = Math.round(angle / angleStep);
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

  // Overlay that darkens the whole screen
  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value ? 1 : 0, { duration: 200 }),
    pointerEvents: isOpen.value ? 'auto' : 'none',
  }));

  // The indicator line following your finger
  const lineStyle = useAnimatedStyle(() => {
    if (!isOpen.value) return { opacity: 0 };
    return {
      opacity: 1,
      width: Math.sqrt(touchX.value ** 2 + touchY.value ** 2),
      transform: [
        { translateX: 0 },
        { translateY: 0 },
        { rotate: `${Math.atan2(touchY.value, touchX.value)}rad` },
      ],
    };
  });

  return (
    <View>
      <GestureDetector gesture={pan}>
        <View>
          {triggerElement}
          
          {/* Full Screen Overlay Portal */}
          <Animated.View style={[styles.fullScreenOverlay, overlayStyle]}>
            <View style={styles.dimmer} />
            
            {/* The Menu Center */}
            <View 
              style={[
                styles.menuOrigin, 
                { left: menuPosition.x, top: menuPosition.y }
              ]}
            >
              {/* Line Connector */}
              <Animated.View style={[styles.connectorLine, lineStyle]} />

              {/* Items */}
              {items.map((item, index) => (
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
              ))}
            </View>
          </Animated.View>
        </View>
      </GestureDetector>
    </View>
  );
}

function RadialItem({ item, index, total, isOpen, activeIndex, radius, colorScheme }: any) {
  const angle = (2 * Math.PI * index) / total;
  
  const animatedStyle = useAnimatedStyle(() => {
    const r = withSpring(isOpen.value ? radius : 0);
    const x = r * Math.cos(angle);
    const y = r * Math.sin(angle);
    const isActive = activeIndex.value === index;

    return {
      transform: [
        { translateX: x - ITEM_SIZE / 2 }, // Center item
        { translateY: y - ITEM_SIZE / 2 },
        { scale: withSpring(isActive ? 1.2 : 1) }
      ],
      opacity: isOpen.value ? 1 : 0,
      zIndex: isActive ? 10 : 1,
    };
  });

  return (
    <Animated.View style={[styles.itemContainer, animatedStyle]}>
      <View style={[
        styles.circle, 
        { 
          backgroundColor: colorScheme === 'dark' ? '#333' : '#fff',
          borderColor: activeIndex.value === index ? '#4a90e2' : 'transparent',
          borderWidth: 2,
        }
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
  fullScreenOverlay: {
    position: 'absolute',
    top: -1000, // Hack to cover screen from wherever the button is
    left: -1000,
    width: 3000,
    height: 3000,
    zIndex: 9999,
    elevation: 9999,
  },
  dimmer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  menuOrigin: {
    position: 'absolute',
    width: 0,
    height: 0,
    // Debugging: backgroundColor: 'red',
  },
  connectorLine: {
    position: 'absolute',
    height: 2,
    backgroundColor: 'white',
    transformOrigin: 'left center', // This might need a polyfill or specific anchor style depending on RN version
    left: 0,
    top: 0,
  },
  itemContainer: {
    position: 'absolute',
    width: ITEM_SIZE,
    height: ITEM_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  itemText: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
  }
});
