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
