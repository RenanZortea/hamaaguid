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
  
  // Store positions map: { [verseId]: yCoordinate }
  const versePositions = useRef<{ [key: number]: number }>({});

  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };

  // Function to register all positions at once (from onTextLayout)
  const setVersePositions = (positions: { [key: number]: number }) => {
    versePositions.current = positions;
    
    // If we have a pending navigation param, try to scroll now
    if (params.highlightVerse) {
        scrollToHighlightedVerse();
    }
  };

  const scrollToHighlightedVerse = () => {
    if (!params.highlightVerse || loading || verses.length === 0) return;

    const verseNum = Number(params.highlightVerse);
    const target = verses.find((v) => v.verse === verseNum);

    if (target && versePositions.current[target.id] !== undefined) {
       const y = versePositions.current[target.id];
       
       // Add a small delay to ensure ScrollView is ready
       setTimeout(() => {
         scrollViewRef.current?.scrollTo({
           y: y + headerHeight, // Adjust for header
           animated: true,
         });
       }, 100);
    }
  };

  // Trigger scroll when params change
  useEffect(() => {
    scrollToHighlightedVerse();
  }, [params.highlightVerse, verses, loading, headerHeight]);

  return {
    scrollViewRef,
    handleHeaderLayout,
    setVersePositions, // Expose this new function
  };
}
