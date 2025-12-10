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

// --- UNIFIED SEARCH ---

export interface SearchResult {
  type: 'book' | 'verse';
  id: string | number;
  label: string;      // For books: Book Name. For verses: "Book Ch:V"
  subLabel?: string;  // For verses: The text preview
  data?: any;         // The full object
}

// Helper to strip Nikkud in JS (for the search query input)
function removeNikkud(text: string): string {
  return text.replace(/[\u0591-\u05C7]/g, "");
}

export function useUnifiedSearch(query: string) {
  const db = useSQLiteContext();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const cleanQuery = removeNikkud(query.trim());
        const wildCardQuery = `%${cleanQuery}%`;

        // 1. Search Books (using the clean query against Book Names)
        const booksPromise = db.getAllAsync<any>(
          `SELECT מזהה as id, שם as name FROM ספרים 
           WHERE שם LIKE ? OR מזהה LIKE ? 
           LIMIT 5`,
          [wildCardQuery, wildCardQuery]
        );

        // 2. Search Verses (searching the NEW 'clean_text' column)
        const versesPromise = db.getAllAsync<any>(
          `SELECT 
             p.מזהה as id, 
             s.שם as book_name, 
             p.פרק as chapter, 
             p.פסוק as verse, 
             p.תוכן as text 
           FROM פסוקים p 
           JOIN ספרים s ON p.מזהה_ספר = s.מזהה
           WHERE p.clean_text LIKE ? 
           ORDER BY p.מזהה ASC
           LIMIT 20`,
          [wildCardQuery]
        );

        const [books, verses] = await Promise.all([booksPromise, versesPromise]);

        // 3. Combine and Format Results
        const formattedResults: SearchResult[] = [
          ...books.map((b) => ({
            type: 'book' as const,
            id: b.id.toString(),
            label: b.name,
            subLabel: 'נווט לספר',
            data: b
          })),
          ...verses.map((v) => ({
            type: 'verse' as const,
            id: v.id,
            label: `${v.book_name} ${v.chapter}:${v.verse}`,
            subLabel: v.text, // Matches are found, but we show original text
            data: v
          }))
        ];

        setResults(formattedResults);
      } catch (e) {
        console.error("Unified Search Error:", e);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms Debounce

    return () => clearTimeout(timer);
  }, [query, db]);

  return { results, loading };
}
