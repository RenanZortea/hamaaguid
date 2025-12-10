import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useRef, useState } from 'react';

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
  
  // Pagination State
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 20;

  // Track the current query to prevent race conditions
  const currentQueryRef = useRef(query);

  const fetchResults = useCallback(async (searchText: string, currentOffset: number, shouldReset: boolean) => {
    // If empty or too short, clear results
    if (!searchText || searchText.trim().length < 2) {
      if (shouldReset) {
        setResults([]);
        setLoading(false);
      }
      return;
    }

    try {
      if (shouldReset) setLoading(true);
      
      const cleanQuery = removeNikkud(searchText.trim());
      const wildCardQuery = `%${cleanQuery}%`;

      // 1. Search Books (Only on first page)
      let books: any[] = [];
      if (currentOffset === 0) {
        books = await db.getAllAsync<any>(
          `SELECT מזהה as id, שם as name FROM ספרים 
           WHERE שם LIKE ? OR מזהה LIKE ? 
           LIMIT 5`,
          [wildCardQuery, wildCardQuery]
        );
      }

      // 2. Search Verses (With Pagination)
      const verses = await db.getAllAsync<any>(
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
          LIMIT ? OFFSET ?`,
        [wildCardQuery, LIMIT, currentOffset]
      );

      // Check if we reached the end
      if (verses.length < LIMIT) {
        setHasMore(false);
      } else {
        setHasMore(true);
      }

      // 3. Format Results
      const newResults: SearchResult[] = [
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
          subLabel: v.text,
          data: v
        }))
      ];

      if (shouldReset) {
        setResults(newResults);
        setLoading(false); // Ensure loading is false after reset
      } else {
        // Append unique results (filtering duplicates just in case)
        setResults(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueNew = newResults.filter(i => !existingIds.has(i.id));
          return [...prev, ...uniqueNew];
        });
      }

    } catch (e) {
      console.error("Unified Search Error:", e);
    } finally {
      // Only unset loading if we were resetting (initial load)
      // If we are loading more, we might handle it differently but usually simpler is fine
      if (shouldReset) setLoading(false);
    }
  }, [db]);

  // Initial Search / Query Change
  useEffect(() => {
    // If the query changed, we must reset
    if (query !== currentQueryRef.current) {
         currentQueryRef.current = query;
         setOffset(0);
         setHasMore(true);
         // Debounce only for the new query
         const timer = setTimeout(() => {
            fetchResults(query, 0, true);
         }, 400); 
         return () => clearTimeout(timer);
    } else if (currentQueryRef.current === '' && results.length > 0) {
        // Clear if empty
         setResults([]);
    }
  }, [query, fetchResults, results.length]);



  // Load More Function
  const loadMore = () => {
    if (!loading && hasMore && query.trim().length >= 2) {
      const nextOffset = offset + LIMIT;
      setOffset(nextOffset);
      fetchResults(query, nextOffset, false);
    }
  };

  return { results, loading, loadMore, hasMore };
}
