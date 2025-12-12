import { useBibleChapter, Verse } from '@/hooks/useBible';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface BibleContextType {
  book: string;
  chapter: number;
  verses: Verse[];
  loading: boolean;
  setBook: (book: string) => void;
  setChapter: (chapter: number) => void;
}

const BibleContext = createContext<BibleContextType | undefined>(undefined);

export function BibleProvider({ children }: { children: ReactNode }) {
  const [book, setBookInternal] = useState('בראשית');
  const [chapter, setChapterInternal] = useState(1);
  const [persistenceLoaded, setPersistenceLoaded] = useState(false);

  // Load saved state on mount
  useEffect(() => {
    async function loadState() {
      try {
        const savedBook = await AsyncStorage.getItem('last_book');
        const savedChapter = await AsyncStorage.getItem('last_chapter');
        
        if (savedBook) setBookInternal(savedBook);
        if (savedChapter) setChapterInternal(parseInt(savedChapter, 10));
      } catch (e) {
        console.error('Failed to load bible state:', e);
      } finally {
        setPersistenceLoaded(true);
      }
    }
    loadState();
  }, []);
  
  // Wrappers to save state
  const setBook = (newBook: string) => {
    setBookInternal(newBook);
    AsyncStorage.setItem('last_book', newBook).catch(e => console.error('Failed to save book:', e));
  };

  const setChapter = (newChapter: number) => {
    setChapterInternal(newChapter);
    AsyncStorage.setItem('last_chapter', String(newChapter)).catch(e => console.error('Failed to save chapter:', e));
  };
  
  // This hook now runs at the top level
  const { verses, loading: bibleLoading } = useBibleChapter(book, chapter);
  
  // Combine loading states - wait for persistence before showing content (optional, but prevents flash)
  const loading = !persistenceLoaded || bibleLoading;

  const value = {
    book,
    chapter,
    verses,
    loading,
    setBook,
    setChapter,
  };

  return (
    <BibleContext.Provider value={value}>
      {children}
    </BibleContext.Provider>
  );
}

export function useBibleContext() {
  const context = useContext(BibleContext);
  if (context === undefined) {
    throw new Error('useBibleContext must be used within a BibleProvider');
  }
  return context;
}
