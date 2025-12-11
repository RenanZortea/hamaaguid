import { parseHebrewNumeral, toHebrewNumeral } from '@/utils/hebrewNumerals';
import { create, insertMultiple, Results, search } from '@orama/orama';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

// Define schema for Orama
const BIBLE_SCHEMA = {
  id: 'string', // Orama requires ID to be a string
  book: 'string',
  chapter: 'number',
  verse: 'number',
  text: 'string',
  cleanText: 'string',
} as const;

export interface SearchResult {
  type: 'book' | 'verse';
  id: string | number;
  label: string;
  subLabel?: string;
  data?: any;
}

// Helper to strip Nikkud in JS (for the search query input)
function removeNikkud(text: string): string {
  return text.replace(/[\u0591-\u05C7]/g, "");
}

export function useOramaSearch(query: string) {
  const db = useSQLiteContext();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  const oramaDb = useRef<any>(null);
  const allBooksRef = useRef<string[]>([]);

  // 1. INITIALIZE: Load all verses from SQLite into Orama + Load Books
  useEffect(() => {
    async function init() {
      if (oramaDb.current) return;

      try {
        // Load Books for Navigation logic
        const bookRows = await db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים ORDER BY מזהה ASC');
        allBooksRef.current = bookRows.map(b => b.שם);

        // Create Orama Index
        oramaDb.current = await create({
          schema: BIBLE_SCHEMA,
        });

        // Fetch all verses including clean_text
        const allVerses = await db.getAllAsync(`
          SELECT 
            p.מזהה as id, 
            s.שם as book, 
            p.פרק as chapter, 
            p.פסוק as verse, 
            p.תוכן as text,
            p.clean_text as cleanText
          FROM פסוקים p 
          JOIN ספרים s ON p.מזהה_ספר = s.מזהה
        `);

        // Insert into Orama - MUST convert id to string
        const formattedVerses = allVerses.map(v => ({
          ...v,
          id: String(v.id), // Ensure ID is a string for Orama
        }));

        await insertMultiple(oramaDb.current, formattedVerses);
        setIsReady(true);
      } catch (e) {
        console.error('Failed to initialize Orama:', e);
      }
    }

    init();
  }, [db]);

  // 2. SEARCH + NAVIGATION LOGIC
  useEffect(() => {
    async function runSearch() {
      if (!isReady || !query || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const cleanQuery = removeNikkud(query.trim());
      
      try {
        let navResult: SearchResult | null = null;
        
        // --- A. NAVIGATION LOGIC ---
        // Try to match "Book Chapter" or "Book Chapter:Verse"
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);
        
        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            const parts = remainder.split(' ');
            
            if (parts.length > 0) {
              const chapStr = parts[0];
              const verseStr = parts.length > 1 ? parts[1] : null;

              const chapNum = parseHebrewNumeral(chapStr);
              if (chapNum > 0) {
                 // Check if chapter/verse exists in DB to confirm valid navigation
                let sql = '';
                let params: any[] = [];
                let isVerseSpecific = false;

                if (verseStr) {
                  const verseNum = parseHebrewNumeral(verseStr);
                  if (verseNum > 0) {
                     sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ? LIMIT 1`;
                     params = [book, chapNum, verseNum];
                     isVerseSpecific = true;
                  }
                }
                
                if (!sql) {
                   // Just Chapter check
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? LIMIT 1`;
                   params = [book, chapNum];
                }

                const row = await db.getFirstAsync<{מזהה: number, תוכן: string}>(sql, params);

                if (row) {
                  const verseNum = isVerseSpecific && verseStr ? parseHebrewNumeral(verseStr) : 1;
                  const navId = isVerseSpecific ? row.מזהה : -1;
                  
                  navResult = {
                    type: 'verse',
                    id: `nav-${book}-${chapNum}-${verseStr || 'all'}`,
                    label: `${book} ${toHebrewNumeral(chapNum)}${isVerseSpecific ? ':' + toHebrewNumeral(verseNum) : ''}`,
                    subLabel: 'נווט למיקום זה',
                    data: {
                      id: navId, 
                      book_name: book,
                      chapter: chapNum,
                      verse: verseNum,
                      text: row.תוכן
                    }
                  };
                }
              }
            }
            break; 
          }
        }

        // --- B. ORAMA FULL TEXT SEARCH ---
        const searchResult: Results<typeof BIBLE_SCHEMA> = await search(oramaDb.current, {
          term: cleanQuery,
          properties: ['cleanText', 'book', 'text'], 
          limit: 20,
          threshold: 0.2, 
          boost: { book: 2 },
        });

        const formattedResults: SearchResult[] = searchResult.hits.map(hit => ({
          type: 'verse',
          id: Number(hit.document.id), // Convert back to number for app compatibility
          label: `${hit.document.book} ${toHebrewNumeral(hit.document.chapter)}:${toHebrewNumeral(hit.document.verse)}`,
          subLabel: hit.document.text,
          data: {
            id: Number(hit.document.id), // Convert back to number
            book_name: hit.document.book,
            chapter: hit.document.chapter,
            verse: hit.document.verse,
            text: hit.document.text
          }
        }));

        if (navResult) {
          formattedResults.unshift(navResult);
        }

        setResults(formattedResults);
      } catch (e) {
        console.error('Search failed:', e);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, isReady]);

  return { results, loading, isReady };
}
