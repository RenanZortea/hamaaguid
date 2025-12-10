import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

export interface Verse {
  id: number;
  book_id: string; // Keeping for compatibility, though we might map it to label
  book_hebrew: string;
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
        // Query using Hebrew table/column names and alias to match Verse interface
        const result = await db.getAllAsync<Verse>(
          `SELECT 
             p.מזהה as id, 
             s.שם as book_hebrew, 
             s.שם as book_id,
             p.פרק as chapter, 
             p.פסוק as verse, 
             p.תוכן as text 
           FROM פסוקים p 
           JOIN ספרים s ON p.מזהה_ספר = s.מזהה
           WHERE s.שם = ? AND p.פרק = ? 
           ORDER BY p.פסוק ASC`,
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
        // Query books from ספרים table
        const result = await db.getAllAsync<{ book_hebrew: string }>(
          `SELECT שם as book_hebrew FROM ספרים ORDER BY מזהה ASC` 
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
        // Find chapters for the given book name
        const result = await db.getAllAsync<{ chapter: number }>(
          `SELECT DISTINCT p.פרק as chapter 
           FROM פסוקים p 
           JOIN ספרים s ON p.מזהה_ספר = s.מזהה 
           WHERE s.שם = ? 
           ORDER BY p.פרק ASC`,
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
