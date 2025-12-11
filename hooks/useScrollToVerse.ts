import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, ScrollView } from 'react-native';

interface Verse {
  id: number;
  verse: number;
}

export function useScrollToVerse(
  params: { highlightVerse?: string | string[] },
  verses: Verse[],
  loading: boolean
) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [targetVerseId, setTargetVerseId] = useState<number | null>(null);

  // Determine the target verse ID based on navigation params
  useEffect(() => {
    if (params.highlightVerse && !loading && verses.length > 0) {
      const verseNum = Number(params.highlightVerse);
      const target = verses.find((v) => v.verse === verseNum);
      
      if (target) {
        setTargetVerseId(target.id);
      }
    } else {
      // Reset if params change or no highlight requested
      setTargetVerseId(null);
    }
  }, [params.highlightVerse, verses, loading]);

  // Capture the header height to offset the scroll position
  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };

  // Check if the current verse being rendered is the target, and scroll if so
  const checkScrollToVerse = (verseId: number, y: number) => {
    if (targetVerseId === verseId && scrollViewRef.current) {
      // Add headerHeight to the verse's relative Y position
      scrollViewRef.current.scrollTo({
        y: y + headerHeight,
        animated: true,
      });
      // Clear target to prevent repeated scrolling
      setTargetVerseId(null);
    }
  };

  return {
    scrollViewRef,
    handleHeaderLayout,
    checkScrollToVerse,
  };
}
