import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

export interface Verse {
  id: number;
  book_id: string;
  chapter: number;
  verse: number;
  text: string;
}


export function useBibleChapter(bookId: string, chapter: number) {
  const db = useSQLiteContext();
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetch() {
      try {
        setLoading(true);
        // This query matches the schema created by your Python script
        const result = await db.getAllAsync<Verse>(
          `SELECT * FROM verses 
           WHERE book_id = ? AND chapter = ? 
           ORDER BY verse ASC`,
          [bookId, chapter]
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
  }, [bookId, chapter, db]);

  return { verses, loading };
}

export function useBooks() {
  const db = useSQLiteContext();
  const [books, setBooks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try {
         // Get distinct book_ids. 
         // Note: If you have a separate 'books' table, query that. 
         // Assuming we only have 'verses' table based on previous context, we select distinct book_id.
         // However, distinct might be slow on large tables without index. 
         // Let's assume there is a verses table.
        const result = await db.getAllAsync<{ book_id: string }>(
          `SELECT DISTINCT book_id FROM verses` 
        );
        setBooks(result.map(r => r.book_id));
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

export function useChapters(bookId: string) {
  const db = useSQLiteContext();
  const [chapters, setChapters] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!bookId) return;
    
    async function fetch() {
      try {
        setLoading(true);
        const result = await db.getAllAsync<{ chapter: number }>(
          `SELECT DISTINCT chapter FROM verses WHERE book_id = ? ORDER BY chapter ASC`,
          [bookId]
        );
        setChapters(result.map(r => r.chapter));
      } catch (e) {
        console.error("Failed to fetch chapters:", e);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [bookId, db]);

  return { chapters, loading };
}
