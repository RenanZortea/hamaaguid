import { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

interface Verse {
  id: number;
  verse: number;
}

export function useScrollToVerse(
  params: { highlightVerse?: string | string[] },
  verses: Verse[],
  loading: boolean,
  offset: number = 0 // New parameter for menu offset
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
           y: y + headerHeight + offset, // Adjust for header + menu offset
           animated: true,
         });
       }, 100);
    }
  };

  // Trigger scroll when params change
  useEffect(() => {
    scrollToHighlightedVerse();
  }, [params.highlightVerse, verses, loading, headerHeight, offset]);

  return {
    scrollViewRef,
    handleHeaderLayout,
    setVersePositions, // Expose this new function
  };
}
