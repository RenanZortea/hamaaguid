import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

export interface Verse {
  id: number;
  book_id: string;
  book_hebrew: string; // Added this field
  chapter: number;
  verse: number;
  text: string;
}

export function useBibleChapter(bookName: string, chapter: number) {
  const db = useSQLiteContext();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetch() {
      try {
        setLoading(true);
        // CHANGED: Query by book_hebrew instead of book_id
        const result = await db.getAllAsync<Verse>(
          `SELECT * FROM verses 
           WHERE book_hebrew = ? AND chapter = ? 
           ORDER BY verse ASC`,
          [bookName, chapter]
        );
        
        if (isMounted) {
          setVerses(result);
        }
      } catch (e) {
        console.error("Failed to fetch chapter:", e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetch();

    return () => { isMounted = false; };
  }, [bookName, chapter, db]);

  return { verses, loading };
}

export function useBooks() {
  const db = useSQLiteContext();
  const [books, setBooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
         // CHANGED: Select book_hebrew and order by tanakh_id
         // We use GROUP BY to get unique books while preserving the ability to sort by tanakh_id
        const result = await db.getAllAsync<{ book_hebrew: string }>(
          `SELECT book_hebrew FROM verses GROUP BY book_hebrew ORDER BY tanakh_id ASC` 
        );
        setBooks(result.map(r => r.book_hebrew));
      } catch (e) {
        console.error("Failed to fetch books:", e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [db]);

  return { books, loading };
}

export function useChapters(bookName: string) {
  const db = useSQLiteContext();
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookName) return;
    
    async function fetch() {
      try {
        setLoading(true);
        // CHANGED: Query where book_hebrew matches
        const result = await db.getAllAsync<{ chapter: number }>(
          `SELECT DISTINCT chapter FROM verses WHERE book_hebrew = ? ORDER BY chapter ASC`,
          [bookName]
        );
        setChapters(result.map(r => r.chapter));
      } catch (e) {
        console.error("Failed to fetch chapters:", e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [bookName, db]);

  return { chapters, loading };
}
