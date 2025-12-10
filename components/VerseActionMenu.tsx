import { GlassView } from '@/components/ui/GlassView';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Clipboard, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';

interface VerseActionMenuProps {
  visible: boolean;
  onCopy: () => void;
  onClose: () => void;
  selectedCount?: number;
}

export function VerseActionMenu({ visible, onCopy, onClose, selectedCount = 1 }: VerseActionMenuProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  
  if (!visible) return null;

  return (
    <Animated.View 
      entering={FadeInDown.springify().damping(25)} 
      exiting={FadeOutDown.springify().damping(25)}
      style={styles.container}
    >
      <GlassView 
        intensity={90} 
        className="rounded-full overflow-hidden"
        contentClassName="flex-row items-center px-6 py-3 gap-4"
      >
        {/* Copy Button */}
        <TouchableOpacity 
          onPress={onCopy} 
          style={styles.actionButton}
          activeOpacity={0.7}
        >
          <Clipboard size={20} color={Colors[theme].text} />
          <Text style={[styles.actionText, { color: Colors[theme].text }]}>
            {selectedCount > 1 ? 'העתק פסוקים' : 'העתק פסוק'}
          </Text>
        </TouchableOpacity>

        {/* Divider */}
        <View style={{ width: 1, height: 20, backgroundColor: Colors[theme].icon, opacity: 0.2 }} />

        {/* Close Button */}
        <TouchableOpacity onPress={onClose} hitSlop={10}>
          <X size={20} color={Colors[theme].text} />
        </TouchableOpacity>
      </GlassView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    zIndex: 100,
    // Add shadow for better visibility
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
