import { useFocusEffect } from 'expo-router';
import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const opacity = useSharedValue(0);

  useFocusEffect(
    useCallback(() => {
      // When the screen comes into focus, animate opacity to 1
      opacity.value = withTiming(1, { duration: 300 });

      return () => {
        // When the screen goes out of focus, reset opacity to 0 so it fades in next time
        opacity.value = 0;
      };
    }, [])
  );

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
