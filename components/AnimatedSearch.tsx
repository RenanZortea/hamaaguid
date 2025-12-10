import { GlassView } from '@/components/ui/GlassView';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SearchResult } from '@/hooks/useBible';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
  ScrollView as AnimatedScrollView,
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated';

// --- CONFIG ---
const SPRING_CONFIG = { damping: 10, stiffness: 120 };
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface AnimatedSearchProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (item: SearchResult) => void;
  results: SearchResult[];
  loading: boolean;
  onSearchChange: (text: string) => void;
  placeholder?: string;
}

export function AnimatedSearch({ 
  visible, 
  onCancel, 
  onSelect, 
  results, 
  loading, 
  onSearchChange,
  placeholder = "חפש ספר, פסוק או מילה..."
}: AnimatedSearchProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';

  // State
  const [query, setQuery] = useState('');
  


  // Update parent when text changes
  const handleTextChange = (text: string) => {
    setQuery(text);
    onSearchChange(text);
  };

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
  const handleBlur = () => {
    Keyboard.dismiss();
    setQuery('');
    onSearchChange(''); // Reset parent query
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
            onChangeText={handleTextChange}
            autoFocus={true}
            textAlign="right" // Hebrew support
          />
          
          {loading ? (
             <ActivityIndicator size="small" color={Colors[theme].icon} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={() => handleTextChange('')}>
               <IconSymbol name="xmark.circle.fill" size={16} color="#8E8E93" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* --- POP-UP SUGGESTIONS --- */}
        {results.length > 0 && (

          <Animated.View 
            entering={FadeIn.duration(200)} 
            style={styles.suggestionsWrapper}
          >
            <GlassView intensity={40} className="rounded-2xl overflow-hidden max-h-80">
              <AnimatedScrollView keyboardShouldPersistTaps="handled">
                {results.map((item, index) => (
                  <Animated.View 
                    key={item.type + "-" + item.id}
                    layout={Layout.springify()} 
                    style={[
                      styles.itemRow,
                      { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                    ]}
                  >
                    <Pressable 
                      style={({ pressed }) => [
                        styles.pressableItem,
                        { backgroundColor: pressed ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)') : 'transparent' }
                      ]}
                      onPress={() => handleSelect(item)}
                    >
                      {/* Icon based on Type */}
                      <IconSymbol 
                        name={item.type === 'book' ? "book.fill" : "text.quote"} 
                        size={14} 
                        color={Colors[theme].tint} 
                        style={{ marginRight: 10 }}
                      />
                      
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.itemLabel, { color: Colors[theme].text }]}>
                          {item.label}
                        </Text>
                        {item.subLabel && (
                          <Text style={styles.itemSubLabel} numberOfLines={1}>
                            {item.subLabel}
                          </Text>
                        )}
                      </View>

                      <IconSymbol name="chevron.right" size={14} color="#8E8E93" />
                    </Pressable>
                  </Animated.View>
                ))}
              </AnimatedScrollView>
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
    // Move it slightly up so keyboard doesn't cover it
    marginBottom: 100, 
  },
  searchBar: {
    flexDirection: 'row-reverse', // RTL for Hebrew
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 0,
    marginRight: 8,
    writingDirection: 'rtl',
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
    flexDirection: 'row-reverse', // RTL
    alignItems: 'center',
    padding: 14,
  },
  itemLabel: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'right',
  },
  itemSubLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
    textAlign: 'right',
  },
});
