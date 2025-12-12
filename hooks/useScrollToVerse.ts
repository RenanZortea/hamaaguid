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
  const versePositions = useRef<{ [key: number]: number }>({});

  // Determine the target verse ID based on navigation params
  useEffect(() => {
    console.log('[useScrollToVerse] Params update:', { 
        highlightVerse: params.highlightVerse, 
        loading, 
        versesCount: verses.length 
    });

    if (params.highlightVerse && !loading && verses.length > 0) {
      const verseNum = Number(params.highlightVerse);
      const target = verses.find((v) => v.verse === verseNum);
      
      console.log('[useScrollToVerse] Found target?', target);

      if (target) {
        setTargetVerseId(target.id);
      }
    } else {
      // Reset if params change or no highlight requested
      setTargetVerseId(null);
    }
  }, [params.highlightVerse, verses, loading]);

  // Clear verse positions when verses change (e.g. new chapter)
  // REMOVED: This causes race conditions if onLayout fires before this effect. 
  // keeping positions is safe as IDs are unique.
  /*
  useEffect(() => {
    console.log('[useScrollToVerse] Verses changed, clearing positions');
    versePositions.current = {};
  }, [verses]);
  */

  // Capture the header height to offset the scroll position
  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    const height = event.nativeEvent.layout.height;
    console.log('[useScrollToVerse] Header height:', height);
    setHeaderHeight(height);
  };

  const performScroll = (y: number) => {
    console.log('[useScrollToVerse] Performing scroll to:', y + headerHeight);
    if (scrollViewRef.current) {
        // Small delay to ensure layout is stable and scroll view is ready
        setTimeout(() => {
            console.log('[useScrollToVerse] Executing scrollTo now');
            scrollViewRef.current?.scrollTo({
                y: y + headerHeight,
                animated: true,
            });
        }, 500);
    } else {
        console.log('[useScrollToVerse] No scrollViewRef.current');
    }
  };

  // Check if we need to scroll whenever targetVerseId changes or headerHeight is set
  useEffect(() => {
    console.log('[useScrollToVerse] Effect check:', { 
        targetVerseId, 
        headerHeight, 
        hasPosition: targetVerseId ? versePositions.current[targetVerseId] !== undefined : 'N/A' 
    });

    // We wait for targetVerseId to be set, versePositions to have the data, and headerHeight to be known.
    if (targetVerseId !== null && versePositions.current[targetVerseId] !== undefined && headerHeight > 0) {
      performScroll(versePositions.current[targetVerseId]);
      
      // We clear the target immediately to avoid double triggers, 
      // relying on the reliable performScroll execution.
      setTargetVerseId(null);
    }
  }, [targetVerseId, headerHeight]); // Note: we can't easily listen to versePositions.current mutations

  // Check if the current verse being rendered is the target, and scroll if so
  const checkScrollToVerse = (verseId: number, y: number) => {
    versePositions.current[verseId] = y;
    console.log('[useScrollToVerse] Registered verse:', verseId, 'at', y);

    if (targetVerseId === verseId && headerHeight > 0) {
      console.log('[useScrollToVerse] Instant scroll trigger for verse:', verseId);
      performScroll(y);
      setTargetVerseId(null);
    }
  };

  return {
    scrollViewRef,
    handleHeaderLayout,
    checkScrollToVerse,
  };
}
