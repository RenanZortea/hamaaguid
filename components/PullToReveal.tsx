import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming
} from "react-native-reanimated";

interface PullToRevealProps {
  children: React.ReactNode;
  menu: React.ReactNode;
  menuHeight: number;
  isAtTop: boolean; // Signal from parent ScrollView
  simultaneousHandlers?: React.RefObject<any>; // Allow ScrollView to work
  backgroundColor?: string;
}

const SPRING_CONFIG = {
  mass: 0.8,
  stiffness: 150,
  damping: 20,
};

export function PullToReveal({
  children,
  menu,
  menuHeight,
  isAtTop,
  simultaneousHandlers,
  backgroundColor,
}: PullToRevealProps) {
  const translateY = useSharedValue(0);
  const context = useSharedValue({ startY: 0 });

  // Use a shared value to bridge isAtTop to the UI thread
  const isAtTopShared = useSharedValue(isAtTop);
  
  // Sync the prop to the shared value
  useEffect(() => {
    isAtTopShared.value = isAtTop;
  }, [isAtTop]);
  // Minimum pull distance before the menu starts moving (prevents accidental triggers)
  const PULL_THRESHOLD = 30;

  // Create base pan gesture
  let pan = Gesture.Pan()
    .onBegin((e) => {
      context.value = { startY: translateY.value };
    })
    .onUpdate((e) => {
        const isPullingDown = e.translationY > 0;
        const isMenuOpen = translateY.value > 0;

        // Only handle if:
        // 1. At top AND pulling down, OR
        // 2. Menu is already open (allow closing)
        if (!isAtTopShared.value && !isMenuOpen) {
            return;
        }

        // If at top but pushing up (scrolling), ignore
        if (isAtTopShared.value && !isPullingDown && !isMenuOpen) {
            return;
        }

        // Apply threshold - only start moving after pulling past threshold
        const effectiveTranslation = Math.max(0, e.translationY - PULL_THRESHOLD);
        const rawY = context.value.startY + effectiveTranslation;
        
        // Stronger Resistance Logic (0.35 instead of 0.5 = harder to pull)
        const dampenedY = rawY > 0 
            ? rawY * 0.35 
            : rawY; 

        translateY.value = Math.max(0, dampenedY);
    })
    .onEnd(() => {
        // Require 50% pull to snap open (was 40%)
        if (translateY.value > menuHeight * 0.5) {
             translateY.value = withSpring(menuHeight, SPRING_CONFIG);
        } else {
             translateY.value = withTiming(0);
        }
    });

  // If we have simultaneous handlers, allow both gestures to work together
  if (simultaneousHandlers?.current) {
    pan = pan.simultaneousWithExternalGesture(simultaneousHandlers);
  }

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  // Animated shadow opacity based on translateY
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateY.value / menuHeight, 1),
  }));

  // Animated menu opacity - fade out menu when mostly closed to prevent overlap
  const menuOpacityStyle = useAnimatedStyle(() => {
    // Start fading at 30% open, fully hidden when closed
    const opacity = translateY.value / (menuHeight * 0.3);
    return {
      opacity: Math.min(Math.max(opacity, 0), 1),
    };
  });

  return (
    <View style={[styles.container, { backgroundColor }]}>
        {/* Menu sits behind - with opacity fade */}
        <Animated.View style={[styles.menuContainer, { height: menuHeight }, menuOpacityStyle]}>
            {menu}
            {/* Bottom shadow/vignette gradient */}
            <Animated.View style={[styles.shadowGradientContainer, shadowStyle]}>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.15)']}
                style={styles.shadowGradient}
              />
            </Animated.View>
        </Animated.View>

        {/* Content sits on top and slides */}
         <GestureDetector gesture={pan}>
            <Animated.View style={[styles.content, animatedStyle, styles.contentShadow, { backgroundColor }]}>
                {children}
            </Animated.View>
         </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
    elevation: 0,
  },
  shadowGradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 20,
  },
  shadowGradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    zIndex: 10,
    elevation: 10,
    overflow: 'hidden', // Prevent content from bleeding through
  },
  contentShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  }
});
