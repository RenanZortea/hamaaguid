import { useBibleChapter, Verse } from '@/hooks/useBible';
import React, { createContext, ReactNode, useContext, useState } from 'react';

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
  const [book, setBook] = useState('בראשית');
  const [chapter, setChapter] = useState(1);
  
  // This hook now runs at the top level (within this provider)
  // causing the data to be fetched immediately when the app starts.
  const { verses, loading } = useBibleChapter(book, chapter);

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
