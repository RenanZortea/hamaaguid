import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

// --- CONFIGURATION ---
const ITEM_HEIGHT = 45;
const VISIBLE_ITEMS = 5;
const WINDOW_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const LEVEL_THRESHOLD = 80; // Drag X distance to switch columns
const SENSITIVITY = 1.2; // Adjusted for better control
const VERTICAL_OFFSET = -100; // Lifts the menu 100px ABOVE the finger

// --- TYPES ---
export interface BibleBook {
  id: string;
  label: string;
  chapters: number;
}
export interface BibleCategory {
  id: string;
  label: string;
  books: BibleBook[];
}

interface GestureMenuOverlayProps {
  isOpen: SharedValue<boolean>;
  touchX: SharedValue<number>;
  touchY: SharedValue<number>;
  origin: SharedValue<{ x: number; y: number }>;
  data: BibleCategory[];
  onSelect: (bookId: string, chapter: number) => void;
}

export function GestureMenuOverlay({ isOpen, touchX, touchY, origin, data, onSelect }: GestureMenuOverlayProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const isDark = colorScheme === 'dark';

  // --- STATE ---
  const activeLevel = useSharedValue(0); // 0=Cat, 1=Book, 2=Chapter
  
  // Selection Indices
  const selectedCatIndex = useSharedValue(0);
  const selectedBookIndex = useSharedValue(0);
  const selectedChapterIndex = useSharedValue(0);

  // Scroll Offsets (pixels)
  const scrollY_0 = useSharedValue(0);
  const scrollY_1 = useSharedValue(0);
  const scrollY_2 = useSharedValue(0);

  // Gesture Tracking
  const startY = useSharedValue(0);
  const startScrollY = useSharedValue(0);

  // --- LOGIC LOOP ---
  useDerivedValue(() => {
    if (!isOpen.value) return;

    const x = touchX.value;
    const y = touchY.value;

    // 1. DETERMINE ACTIVE LEVEL (Drag Right)
    let newLevel = 0;
    if (x > LEVEL_THRESHOLD) newLevel = 1;
    if (x > LEVEL_THRESHOLD * 2.4) newLevel = 2;

    // Detect Level Change
    if (newLevel !== activeLevel.value) {
      activeLevel.value = newLevel;
      // Reset start positions for smooth takeover
      startY.value = y; 
      if (newLevel === 0) startScrollY.value = scrollY_0.value;
      if (newLevel === 1) startScrollY.value = scrollY_1.value;
      if (newLevel === 2) startScrollY.value = scrollY_2.value;
    }

    // 2. HANDLE SCROLLING (Drag Up/Down)
    const deltaY = (y - startY.value) * SENSITIVITY;
    const targetScroll = startScrollY.value - deltaY;

    if (activeLevel.value === 0) {
      const max = (data.length - 1) * ITEM_HEIGHT;
      scrollY_0.value = Math.max(0, Math.min(targetScroll, max));
      selectedCatIndex.value = Math.round(scrollY_0.value / ITEM_HEIGHT);
    } 
    else if (activeLevel.value === 1) {
      const cat = data[selectedCatIndex.value];
      if (cat) {
        const max = (cat.books.length - 1) * ITEM_HEIGHT;
        scrollY_1.value = Math.max(0, Math.min(targetScroll, max));
        selectedBookIndex.value = Math.round(scrollY_1.value / ITEM_HEIGHT);
      }
    } 
    else if (activeLevel.value === 2) {
      const cat = data[selectedCatIndex.value];
      const book = cat?.books[selectedBookIndex.value];
      if (book) {
        const max = (book.chapters - 1) * ITEM_HEIGHT;
        scrollY_2.value = Math.max(0, Math.min(targetScroll, max));
        selectedChapterIndex.value = Math.round(scrollY_2.value / ITEM_HEIGHT);
      }
    }
  });

  // --- FINALIZE SELECTION ---
  useAnimatedReaction(
    () => isOpen.value,
    (open, prev) => {
      if (!open && prev) {
        // User lifted finger
        const cat = data[selectedCatIndex.value];
        const book = cat?.books[selectedBookIndex.value];
        if (book && activeLevel.value >= 1) {
           const chapter = activeLevel.value === 2 ? selectedChapterIndex.value + 1 : 1;
           runOnJS(onSelect)(book.id, chapter);
        }
      } else if (open && !prev) {
        // Reset on Open
        activeLevel.value = 0;
        startY.value = 0;
        startScrollY.value = 0;
      }
    }
  );

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value ? 1 : 0, { duration: 150 }),
    pointerEvents: isOpen.value ? 'auto' : 'none',
  }));

  // Helper for Window Styles
  const getWindowStyle = (level: number) => useAnimatedStyle(() => {
    const isActive = activeLevel.value === level;
    const isPast = activeLevel.value > level;
    
    // Position X: Cascading to the right
    let targetX = origin.value.x;
    if (level === 1) targetX += LEVEL_THRESHOLD + 10;
    if (level === 2) targetX += (LEVEL_THRESHOLD * 2.4) + 20;
    
    // Position Y: Lifted above finger
    const targetY = origin.value.y - (WINDOW_HEIGHT / 2) + VERTICAL_OFFSET;

    return {
      transform: [
        { translateX: withSpring(targetX, { damping: 15, stiffness: 100 }) },
        { translateY: withSpring(targetY, { damping: 15, stiffness: 100 }) },
        { scale: withSpring(isActive ? 1.05 : isPast ? 0.95 : 0.8) },
      ],
      opacity: withTiming(isActive || isPast ? 1 : 0),
      zIndex: isActive ? 100 : 10,
      backgroundColor: isDark ? 'rgba(30,30,30,0.95)' : 'rgba(250,250,250,0.98)',
      borderColor: isDark ? 'rgba(80,80,80,0.5)' : 'rgba(200,200,200,0.5)',
    };
  });

  return (
    <Animated.View style={[styles.overlay, overlayStyle]}>
      {/* Darker Dimmer */}
      <View style={styles.dimmer} />

      {/* --- COLUMN 0: CATEGORIES --- */}
      <Animated.View style={[styles.listWindow, getWindowStyle(0)]}>
        <ScrollableList 
          items={data} 
          scrollPos={scrollY_0} 
          isDark={isDark} 
          labelKey="label"
        />
        <SelectionHighlight isDark={isDark} />
      </Animated.View>

      {/* --- COLUMN 1: BOOKS --- */}
      <Animated.View style={[styles.listWindow, getWindowStyle(1)]}>
        <ReactiveBookList 
           data={data} 
           catIndex={selectedCatIndex} 
           scrollPos={scrollY_1} 
           isDark={isDark} 
        />
        <SelectionHighlight isDark={isDark} />
      </Animated.View>

      {/* --- COLUMN 2: CHAPTERS --- */}
      <Animated.View style={[styles.listWindow, getWindowStyle(2)]}>
        <ReactiveChapterList 
           data={data} 
           catIndex={selectedCatIndex} 
           bookIndex={selectedBookIndex}
           scrollPos={scrollY_2} 
           isDark={isDark} 
        />
        <SelectionHighlight isDark={isDark} />
      </Animated.View>

    </Animated.View>
  );
}

// --- SUB COMPONENTS ---

function ScrollableList({ items, scrollPos, isDark, labelKey = 'label' }: any) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -scrollPos.value + (ITEM_HEIGHT * 2) }] // Center in 5-item window
  }));

  return (
    <Animated.View style={animatedStyle}>
      {items.map((item: any, i: number) => (
        <View key={i} style={styles.item}>
          <Text 
            style={[
              styles.text, 
              { color: isDark ? '#EEE' : '#111' }
            ]}
            numberOfLines={1}
          >
            {item[labelKey] || item}
          </Text>
        </View>
      ))}
    </Animated.View>
  );
}

function ReactiveBookList({ data, catIndex, scrollPos, isDark }: any) {
  return (
    <>
      {data.map((cat: any, i: number) => (
        <AnimatedListWrapper key={i} visibleIndex={catIndex} myIndex={i}>
           <ScrollableList items={cat.books} scrollPos={scrollPos} isDark={isDark} />
        </AnimatedListWrapper>
      ))}
    </>
  );
}

function ReactiveChapterList({ data, catIndex, bookIndex, scrollPos, isDark }: any) {
  return (
    <>
      {data.map((cat: any, cIdx: number) => (
        <AnimatedListWrapper key={`c-${cIdx}`} visibleIndex={catIndex} myIndex={cIdx}>
           {cat.books.map((book: any, bIdx: number) => (
             <AnimatedListWrapper key={`b-${bIdx}`} visibleIndex={bookIndex} myIndex={bIdx}>
                <ScrollableList 
                  items={Array.from({length: book.chapters}, (_, k) => k + 1)} 
                  scrollPos={scrollPos} 
                  isDark={isDark} 
                />
             </AnimatedListWrapper>
           ))}
        </AnimatedListWrapper>
      ))}
    </>
  );
}

function AnimatedListWrapper({ children, visibleIndex, myIndex }: any) {
  const style = useAnimatedStyle(() => ({
    opacity: visibleIndex.value === myIndex ? 1 : 0,
    display: visibleIndex.value === myIndex ? 'flex' : 'none',
  }));
  return <Animated.View style={[styles.wrapper, style]}>{children}</Animated.View>;
}

function SelectionHighlight({ isDark }: { isDark: boolean }) {
  return (
    <View style={[
      styles.highlight, 
      { 
        borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
      }
    ]} />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  dimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', // Darker background
  },
  listWindow: {
    position: 'absolute',
    width: 140,
    height: WINDOW_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    top: 0,
    left: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 20,
    borderWidth: 1,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  text: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  wrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    pointerEvents: 'none',
  }
});