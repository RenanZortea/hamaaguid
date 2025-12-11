import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SearchResult } from '@/hooks/useBible';
import React, { useEffect, useState, useRef } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  Keyboard,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Platform
} from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  Layout
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface AnimatedSearchProps {
  visible: boolean;
  onCancel: () => void;
  onSelect: (item: SearchResult) => void;
  results: SearchResult[];
  loading: boolean;
  onSearchChange: (text: string) => void;
  placeholder?: string;
  onLoadMore?: () => void;
}

export function AnimatedSearch({ 
  visible, 
  onCancel, 
  onSelect, 
  results, 
  loading, 
  onSearchChange,
  placeholder = "חפש ספר, פסוק או מילה...",
  onLoadMore
}: AnimatedSearchProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme ?? 'light';
  const isDark = theme === 'dark';
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  
  const handleTextChange = (text: string) => {
    setQuery(text);
    onSearchChange(text);
  };

  useEffect(() => {
    if (!visible) return;

    // Force focus after animation starts to ensure keyboard appears
    const timer = setTimeout(() => {
        inputRef.current?.focus();
    }, 100);

    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBlur();
      return true;
    });

    return () => {
        backHandler.remove();
        clearTimeout(timer);
    };
  }, [visible]);

  const handleBlur = () => {
    Keyboard.dismiss();
    setQuery('');
    onSearchChange('');
    onCancel?.();
  };

  const handleSelect = (item: SearchResult) => {
    onSelect(item);
    handleBlur();
  };

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 20) {
      onLoadMore?.();
    }
  };

  if (!visible) return null;

  return (
    <View style={[styles.fullscreenOverlay, { paddingTop: insets.top + 10 }]}>
      <Pressable style={styles.backdrop} onPress={handleBlur} />
      
      <Animated.View 
        entering={FadeIn.duration(200)} 
        exiting={FadeOut.duration(150)}
        style={styles.container}
      >
        <View style={[
          styles.searchBar, 
          { backgroundColor: isDark ? '#262626' : '#E5E7EB' }
        ]}>
          <IconSymbol
            name="magnifyingglass"
            size={18}
            color={Colors[theme].icon}
            style={{ marginEnd: 8 }} 
          />
          
          <TextInput
            ref={inputRef}
            style={[styles.input, { color: Colors[theme].text }]}
            placeholder={placeholder}
            placeholderTextColor="#8E8E93"
            value={query}
            onChangeText={handleTextChange}
            // textAlign is handled by React Native automatically for Hebrew usually, 
            // but explicit 'right' on iOS often helps with cursor placement.
            textAlign={Platform.OS === 'ios' ? 'right' : undefined} 
          />
          
          {loading && results.length === 0 ? (
             <ActivityIndicator size="small" color={Colors[theme].icon} />
          ) : query.length > 0 ? (
            <TouchableOpacity onPress={() => handleTextChange('')}>
               <IconSymbol name="xmark.circle.fill" size={16} color="#8E8E93" />
            </TouchableOpacity>
          ) : null}
        </View>

        {results.length > 0 && (
          <Animated.View 
            entering={FadeIn.duration(200)} 
            style={styles.suggestionsWrapper}
          >
            <View style={{
                borderRadius: 16,
                padding: 12,
                overflow: 'hidden',
                maxHeight: 320,
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
            }}>
              <Animated.ScrollView 
                keyboardShouldPersistTaps="handled"
                onScroll={handleScroll}
                scrollEventThrottle={16}
              >
                {results.map((item, index) => (
                  <Animated.View 
                    key={`${item.type}-${item.id}-${index}`}
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
                      <View style={{ flex: 1, paddingVertical: 4 }}>
                        {item.type === 'verse' ? (
                          <>
                             <Text 
                               style={[
                                 styles.itemLabel, 
                                 { color: Colors[theme].text, fontSize: 18, fontWeight: '600', marginBottom: 6 }
                               ]}
                               numberOfLines={2}
                             >
                               {item.subLabel}
                             </Text>
                             <Text style={[styles.itemSubLabel, { fontSize: 14 }]}>
                               {item.label}
                             </Text>
                          </>
                        ) : (
                          <>
                            <Text style={[styles.itemLabel, { color: Colors[theme].text }]}>
                              {item.label}
                            </Text>
                            {item.subLabel && (
                              <Text style={styles.itemSubLabel} numberOfLines={1}>
                                {item.subLabel}
                              </Text>
                            )}
                          </>
                        )}
                      </View>
                    </Pressable>
                  </Animated.View>
                ))}
              </Animated.ScrollView>
            </View>
          </Animated.View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fullscreenOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999, // Fix: Ensure it sits above everything
    elevation: 50, // Fix: Android elevation to show above FAB/Dialogs
    justifyContent: 'flex-start',
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
    marginBottom: 8,
  },
  pressableItem: {
    flexDirection: 'row', 
    alignItems: 'flex-start',
    padding: 16,
    paddingVertical: 18,
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
