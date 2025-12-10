import { useColorScheme } from '@/hooks/use-color-scheme';
import React from 'react';
import { StyleSheet, Text } from 'react-native';
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

const ITEM_HEIGHT = 40;
const COLUMN_WIDTH = 120;
const LEVEL_THRESHOLD = 60; // How far right to drag to enter next level

// Data Interfaces
export interface BibleCategory {
  id: string;
  label: string;
  books: BibleBook[];
}
export interface BibleBook {
  id: string; // The book name used in DB
  label: string;
  chapters: number;
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

  // State to track locked selections
  const activeLevel = useSharedValue(0); // 0 = Category, 1 = Book, 2 = Chapter
  const selectedCatIndex = useSharedValue(0);
  const selectedBookIndex = useSharedValue(0);
  const selectedChapterIndex = useSharedValue(0);

  // Latch values: Where was the finger (Y) when we entered the level?
  const level1EntryY = useSharedValue(0);
  const level2EntryY = useSharedValue(0);

  // Logic Loop
  useDerivedValue(() => {
    if (!isOpen.value) return;

    const x = touchX.value;
    const y = touchY.value;

    // --- LEVEL 0: CATEGORY ---
    if (x < LEVEL_THRESHOLD) {
      activeLevel.value = 0;
      // Map Y directly to Category Index
      // We center the list at the origin, so 0 is the middle
      const idx = Math.round(y / ITEM_HEIGHT);
      // Clamp index
      const clamped = Math.max(0, Math.min(idx, data.length - 1));
      selectedCatIndex.value = clamped;
    } 
    
    // --- LEVEL 1: BOOK ---
    else if (x >= LEVEL_THRESHOLD && x < LEVEL_THRESHOLD * 2.5) {
      // Transition detection: If we just entered Level 1, save the Entry Y offset
      if (activeLevel.value === 0) {
         level1EntryY.value = y; 
      }
      activeLevel.value = 1;

      // Determine Book Index based on Relative Y from entry point
      const relY = y - level1EntryY.value;
      const cat = data[selectedCatIndex.value];
      if (cat && cat.books.length > 0) {
        const idx = Math.round(relY / ITEM_HEIGHT);
        // Default to middle of list or top? Let's default to 0 being the start
        // To make it feel natural, dragging DOWN selects lower items.
        // We'll auto-select the first book on entry, then add relative movement.
        const clamped = Math.max(0, Math.min(idx, cat.books.length - 1));
        selectedBookIndex.value = clamped;
      }
    }

    // --- LEVEL 2: CHAPTER ---
    else if (x >= LEVEL_THRESHOLD * 2.5) {
      if (activeLevel.value === 1) {
        level2EntryY.value = y;
      }
      activeLevel.value = 2;

      const relY = y - level2EntryY.value;
      const cat = data[selectedCatIndex.value];
      const book = cat?.books[selectedBookIndex.value];
      
      if (book) {
        // Calculate total chapters (assuming 1-based index)
        const idx = Math.round(relY / ITEM_HEIGHT);
        const clamped = Math.max(0, Math.min(idx, book.chapters - 1));
        selectedChapterIndex.value = clamped;
      }
    }
  });

  // Handle Final Selection on Release
  useAnimatedReaction(
    () => isOpen.value,
    (open, prev) => {
      if (!open && prev) {
        // User released finger
        if (activeLevel.value === 2) {
          const cat = data[selectedCatIndex.value];
          const book = cat?.books[selectedBookIndex.value];
          if (book) {
            const chapter = selectedChapterIndex.value + 1; // 1-based
            runOnJS(onSelect)(book.id, chapter);
          }
        } else if (activeLevel.value === 1) {
            // Optional: Allow selecting just a book (default ch 1)
            const cat = data[selectedCatIndex.value];
            const book = cat?.books[selectedBookIndex.value];
            if(book) runOnJS(onSelect)(book.id, 1);
        }
      }
    }
  );

  const containerStyle = useAnimatedStyle(() => ({
    opacity: withTiming(isOpen.value ? 1 : 0),
    pointerEvents: isOpen.value ? 'auto' : 'none',
  }));

  // Dynamic Styles for Columns
  const level0Style = useAnimatedStyle(() => {
    const isActive = activeLevel.value >= 0;
    return {
      opacity: withTiming(isActive ? 1 : 0.5),
      transform: [
        { translateX: origin.value.x - COLUMN_WIDTH / 2 }, // Centered on finger initially
        { translateY: origin.value.y },
        { scale: withSpring(activeLevel.value === 0 ? 1 : 0.8) }
      ],
    };
  });

  const level1Style = useAnimatedStyle(() => {
    const isActive = activeLevel.value >= 1;
    return {
      opacity: withTiming(isActive ? 1 : 0),
      transform: [
        { translateX: origin.value.x + LEVEL_THRESHOLD }, // Shifted Right
        { translateY: origin.value.y + (activeLevel.value >= 1 ? level1EntryY.value : 0) }, // Anchored to where we entered
        { scale: withSpring(activeLevel.value === 1 ? 1 : 0.8) }
      ],
    };
  });

  const level2Style = useAnimatedStyle(() => {
    const isActive = activeLevel.value >= 2;
    return {
      opacity: withTiming(isActive ? 1 : 0),
      transform: [
        { translateX: origin.value.x + LEVEL_THRESHOLD * 2.5 }, // Shifted Right again
        { translateY: origin.value.y + (activeLevel.value >= 2 ? level2EntryY.value : 0) },
        { scale: withSpring(activeLevel.value === 2 ? 1 : 0.8) }
      ],
    };
  });

  return (
    <Animated.View style={[styles.overlay, containerStyle]}>
      <Animated.View style={styles.dimmer} />

      {/* Categories Column */}
      <Animated.View style={[styles.columnContainer, level0Style]}>
        {data.map((cat, i) => (
          <ListItem 
            key={cat.id} 
            label={cat.label} 
            index={i} 
            activeIndex={selectedCatIndex} 
            isDark={isDark} 
          />
        ))}
      </Animated.View>

      {/* Books Column (Dependent on Category Selection) */}
      <Animated.View style={[styles.columnContainer, level1Style]}>
        <BooksList 
          data={data} 
          catIndex={selectedCatIndex} 
          bookIndex={selectedBookIndex}
          isDark={isDark}
        />
      </Animated.View>

      {/* Chapters Column (Dependent on Book Selection) */}
      <Animated.View style={[styles.columnContainer, level2Style]}>
        <ChaptersList
            data={data}
            catIndex={selectedCatIndex}
            bookIndex={selectedBookIndex}
            chapterIndex={selectedChapterIndex}
            isDark={isDark}
        />
      </Animated.View>

    </Animated.View>
  );
}

// Sub-components to render lists reactively
function BooksList({ data, catIndex, bookIndex, isDark }: any) {
  // SOLUTION: We map the *entire* tree, but hide inactive ones with opacity.
  return (
    <>
      {data.map((cat: any, cIdx: number) => (
        <AnimatedListWrapper key={cat.id} visibleIndex={catIndex} myIndex={cIdx}>
           {cat.books.map((book: any, bIdx: number) => (
             <ListItem key={book.id} label={book.label} index={bIdx} activeIndex={bookIndex} isDark={isDark} />
           ))}
        </AnimatedListWrapper>
      ))}
    </>
  );
}

function ChaptersList({ data, catIndex, bookIndex, chapterIndex, isDark }: any) {
  return (
    <>
      {data.map((cat: any, cIdx: number) => (
        <AnimatedListWrapper key={cat.id} visibleIndex={catIndex} myIndex={cIdx}>
           {cat.books.map((book: any, bIdx: number) => (
             <AnimatedListWrapper key={book.id} visibleIndex={bookIndex} myIndex={bIdx}>
                {Array.from({ length: book.chapters }).map((_, chIdx) => (
                    <ListItem key={chIdx} label={`${chIdx + 1}`} index={chIdx} activeIndex={chapterIndex} isDark={isDark} />
                ))}
             </AnimatedListWrapper>
           ))}
        </AnimatedListWrapper>
      ))}
    </>
  );
}

function AnimatedListWrapper({ children, visibleIndex, myIndex }: any) {
    const style = useAnimatedStyle(() => ({
        display: visibleIndex.value === myIndex ? 'flex' : 'none',
    }));
    return <Animated.View style={[styles.stack, style]}>{children}</Animated.View>;
}

function ListItem({ label, index, activeIndex, isDark }: any) {
  const style = useAnimatedStyle(() => {
    const isActive = activeIndex.value === index;
    return {
      backgroundColor: isActive ? (isDark ? '#444' : '#eee') : 'transparent',
      transform: [{ scale: withSpring(isActive ? 1.1 : 1) }],
      opacity: withSpring(isActive ? 1 : 0.6),
    };
  });

  return (
    <Animated.View style={[styles.item, style]}>
      <Text style={[styles.text, { color: isDark ? '#fff' : '#000' }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  dimmer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  columnContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: COLUMN_WIDTH,
    // Center the list vertically around the point?
    // We actually want the `translateY` to move the list so the selected item is under the finger?
    // Currently, `translateY` moves the WHOLE container. 
    // To center: marginTop: -ITEM_HEIGHT / 2?
    justifyContent: 'center', // This might conflict with absolute positioning logic
  },
  stack: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
    marginVertical: 1,
  },
  text: {
    fontSize: 14,
    fontWeight: 'bold',
  }
});
