import { toHebrewNumeral, parseHebrewNumeral } from '@/utils/hebrewNumerals';
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

  // Cache all book names for parsing navigation queries
  const [allBooks, setAllBooks] = useState<string[]>([]);
  useEffect(() => {
    db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים').then(rows => {
      setAllBooks(rows.map(r => r.שם));
    }).catch(e => console.error("Failed to load books for search", e));
  }, [db]);

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

      let navResult: SearchResult | null = null;
      let usedNav = false;

      // 0. Parse Direct Navigation (Only on first page)
      if (currentOffset === 0 && allBooks.length > 0) {
        // Sort books by length (desc) to ensure we match "Shmuel Aleph" before "Shmuel"
        const sortedBooks = [...allBooks].sort((a, b) => b.length - a.length);
        
        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            // Check remainder
            const remainder = cleanQuery.slice(book.length).trim();
            const parts = remainder.split(' ');
            
            if (parts.length > 0) {
              const chapStr = parts[0];
              const verseStr = parts.length > 1 ? parts[1] : null;

              const chapNum = parseHebrewNumeral(chapStr);
              if (chapNum > 0) {
                // Determine what we are looking for
                let sql = '';
                let params: any[] = [];
                let isVerseSpecific = false;

                if (verseStr) {
                  const verseNum = parseHebrewNumeral(verseStr);
                  if (verseNum > 0) {
                    // Look for specific verse
                    sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ? LIMIT 1`;
                    params = [book, chapNum, verseNum];
                    isVerseSpecific = true;
                  }
                }
                
                if (!sql) {
                   // Look for chapter existence (just get first verse)
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? LIMIT 1`;
                   params = [book, chapNum];
                }

                const row = await db.getFirstAsync<{מזהה: number, תוכן: string}>(sql, params);
                
                if (row) {
                  // If just chapter, use ID -1 to prevent highlighting a random verse, 
                  // or use row.מזהה if we want to jump to beginning.
                  // Reader expects ID for highlighting.
                  const navId = isVerseSpecific ? row.מזהה : -1;
                  const label = isVerseSpecific 
                    ? `${book} ${toHebrewNumeral(chapNum)}:${toHebrewNumeral(parseHebrewNumeral(verseStr!))}`
                    : `${book} ${toHebrewNumeral(chapNum)}`;

                  navResult = {
                    type: 'verse',
                    id: `nav-${book}-${chapNum}-${verseStr || 'all'}`,
                    label: label,
                    subLabel: isVerseSpecific ? row.תוכן : 'נווט לפרק',
                    data: {
                      book_name: book,
                      chapter: chapNum,
                      verse: isVerseSpecific ? parseHebrewNumeral(verseStr!) : 1,
                      id: navId,
                      text: row.תוכן
                    }
                  };
                  usedNav = true;
                }
              }
            }
            // If we matched the book prefix, we stop trying other books
            break; 
          }
        }
      }

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
      const parsedResults: SearchResult[] = [
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
          label: `${v.book_name} ${toHebrewNumeral(v.chapter)}:${toHebrewNumeral(v.verse)}`,
          subLabel: v.text,
          data: v
        }))
      ];

      // Prepend navigation result if exists
      if (navResult) {
        parsedResults.unshift(navResult);
      }

      if (shouldReset) {
        setResults(parsedResults);
        setLoading(false); // Ensure loading is false after reset
      } else {
        // Append unique results (filtering duplicates just in case)
        setResults(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const uniqueNew = parsedResults.filter(i => !existingIds.has(i.id));
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
  }, [db, allBooks]);

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
