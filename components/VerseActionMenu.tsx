import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Clipboard, Heart, X } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';

interface VerseActionMenuProps {
  visible: boolean;
  onCopy: () => void;
  onFavorite?: () => void;
  isFavorite?: boolean;
  onClose: () => void;
  selectedCount?: number;
}

export function VerseActionMenu({ visible, onCopy, onFavorite, isFavorite = false, onClose, selectedCount = 1 }: VerseActionMenuProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      opacity.value = withSpring(1, { damping: 25 });
      translateY.value = withSpring(0, { damping: 25 });
    } else {
      opacity.value = withSpring(0, { damping: 25 });
      translateY.value = withSpring(50, { damping: 25 });
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View 
      style={[styles.container, animatedStyle]}
      // Immediately disable pointer events when not visible, allowing touches to pass through during exit animation
      pointerEvents={visible ? 'auto' : 'none'}
    >
      <View style={{ gap: 12, alignItems: 'center' }}>
        
        {/* 1. Favorite Bubble */}
        <TouchableOpacity 
          onPress={onFavorite}
          activeOpacity={0.8}
        >
          <GlassView 
            intensity={90} 
            className="rounded-full overflow-hidden"
            contentClassName="flex-row items-center px-6 py-3 gap-3"
          >
            <Heart 
              size={20} 
              color={isFavorite ? "#FF3B30" : Colors[theme].text} 
              fill={isFavorite ? "#FF3B30" : "transparent"}
            />
            <Text style={[styles.actionText, { color: Colors[theme].text }]}>
              {isFavorite ? 'הסר ממועדפים' : 'שמור למועדפים'}
            </Text>
          </GlassView>
        </TouchableOpacity>

        {/* 2. Copy Bubble */}
        <TouchableOpacity 
          onPress={onCopy}
          activeOpacity={0.8}
        >
          <GlassView 
            intensity={90} 
            className="rounded-full overflow-hidden"
            contentClassName="flex-row items-center px-6 py-3 gap-3"
          >
            <Clipboard size={20} color={Colors[theme].text} />
            <Text style={[styles.actionText, { color: Colors[theme].text }]}>
              {selectedCount > 1 ? 'העתק פסוקים' : 'העתק פסוק'}
            </Text>
          </GlassView>
        </TouchableOpacity>

        {/* 3. Close Bubble (Popped out) */}
        <TouchableOpacity 
          onPress={onClose}
          activeOpacity={0.8}
          style={{ marginTop: 4 }}
        >
          <GlassView 
            intensity={80} 
            className="rounded-full overflow-hidden"
            contentClassName="flex-row items-center justify-center w-12 h-12"
          >
            <X size={24} color={Colors[theme].text} />
          </GlassView>
        </TouchableOpacity>

      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 100,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
