import { GlassView } from '@/components/ui/GlassView';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SearchResult, useUnifiedSearch } from '@/hooks/useBible';
import React, { useEffect, useState } from 'react';
import {
  BackHandler,
  Dimensions,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated';

// --- CONFIG ---
const SPRING_CONFIG = { damping: 10, stiffness: 120 };
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AnimatedSearchProps {
  onSelect: (item: SearchResult) => void;
  onCancel?: () => void;
  placeholder?: string;
  visible?: boolean;
}

export function AnimatedSearch({ onSelect, onCancel, placeholder = "Search...", visible = true }: AnimatedSearchProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';

  // State
  // State
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  // Unified Search Hook
  const { results, loading } = useUnifiedSearch(query);

  // --- BACK HANDLER ---
  useEffect(() => {
    if (!visible) return;

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBlur();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, [visible]);

  // --- HANDLERS ---
  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    Keyboard.dismiss();
    setIsFocused(false);
    setQuery('');
    onCancel?.();
  };

  const handleSelect = (item: SearchResult) => {
    onSelect(item);
    handleBlur();
  };



  if (!visible) return null;

  return (
    <View style={styles.fullscreenOverlay}>
      {/* Backdrop to dismiss on tap */}
      <Pressable style={styles.backdrop} onPress={handleBlur} />
      
      <Animated.View 
        entering={FadeIn.duration(200)} 
        exiting={FadeOut.duration(150)}
        style={styles.container}
      >
        
        {/* --- SEARCH BAR --- */}
        <View style={[
          styles.searchBar, 
          { backgroundColor: isDark ? '#262626' : '#E5E7EB' }
        ]}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={Colors[theme].icon}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.input, { color: Colors[theme].text }]}
            placeholder={placeholder}
            placeholderTextColor="#8E8E93"
            value={query}
            onChangeText={setQuery}
            onFocus={handleFocus}
            autoFocus={true}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
               <IconSymbol name="xmark.circle.fill" size={16} color="#8E8E93" />
            </TouchableOpacity>
          )}
        </View>

        {/* --- POP-UP SUGGESTIONS --- */}
        {isFocused && (results.length > 0 || loading) && (

          <Animated.View 
            entering={FadeIn.duration(200)} 
            exiting={FadeOut.duration(150)}
            style={styles.suggestionsWrapper}
          >
            <GlassView intensity={40} className="rounded-2xl overflow-hidden">
              {loading && results.length === 0 ? (
                 <View style={{ padding: 20, alignItems: 'center' }}>
                    <Text style={{ color: Colors[theme].text }}>מחפש...</Text>
                 </View>
              ) : (
                results.map((item, index) => (
                  <Animated.View 
                    key={`${item.type}-${item.id}`}
                  layout={Layout.springify()} 
                  style={[
                    styles.itemRow,
                    { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' },
                    index === results.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <Pressable 
                    style={({ pressed }) => [
                      styles.pressableItem,
                      { backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent' }
                    ]}
                    onPress={() => handleSelect(item)}
                  >
                    <View>
                      <Text style={[styles.itemLabel, { color: Colors[theme].text }]}>
                        {item.label}
                      </Text>
                      {item.subLabel && (
                        <Text style={styles.itemSubLabel}>{item.subLabel}</Text>
                      )}
                    </View>
                    <IconSymbol name="chevron.right" size={14} color="#8E8E93" style={{ marginLeft: 'auto' }} />
                  </Pressable>
                </Animated.View>
                ))
              )}
            </GlassView>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  container: {
    width: '90%',
    maxWidth: 400,
  },

  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 0, 
  },
  suggestionsWrapper: {
    marginTop: 8,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  itemRow: {
    borderBottomWidth: 1,
  },
  pressableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  itemSubLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
});
