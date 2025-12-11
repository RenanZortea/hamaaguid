import { parseHebrewNumeral, toHebrewNumeral } from '@/utils/hebrewNumerals';
import { create, insertMultiple, Results, search } from '@orama/orama';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

// 1. CHANGE SCHEMA: Use 'string' for everything to prevent TypeErrors
const BIBLE_SCHEMA = {
  id: 'string',
  book: 'string',
  chapter: 'string', // Changed from number
  verse: 'string',   // Changed from number
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

// Helper to strip Nikkud (Vowels)
function removeNikkud(text: string): string {
  return text ? text.replace(/[\u0591-\u05C7]/g, "") : "";
}

export function useOramaSearch(query: string) {
  const db = useSQLiteContext();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
   
  const oramaDb = useRef<any>(null);
  const allBooksRef = useRef<string[]>([]);

  // --- INITIALIZATION ---
  useEffect(() => {
    async function init() {
      if (oramaDb.current) return;

      console.log("DEBUG: Starting Orama initialization...");
      try {
        const bookRows = await db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים ORDER BY מזהה ASC');
        allBooksRef.current = bookRows.map(b => b.שם);

        oramaDb.current = await create({
          schema: BIBLE_SCHEMA,
        });

        // Fetch Raw Data
        const allVerses = await db.getAllAsync(`
          SELECT 
            p.מזהה as id, 
            s.שם as book, 
            p.פרק as chapter, 
            p.פסוק as verse, 
            p.תוכן as text
            -- We ignore SQL clean_text and generate it in JS to be safe
          FROM פסוקים p 
          JOIN ספרים s ON p.מזהה_ספר = s.מזהה
        `);

        // FIX 1 & 2: Generate cleanText manually AND convert numbers to strings
        const formattedVerses = allVerses.map(v => {
            const textVal = v.text || '';
            return {
                id: String(v.id || ''), 
                book: v.book || '',
                chapter: String(v.chapter || '0'), // Force String
                verse: String(v.verse || '0'),     // Force String
                text: textVal,
                cleanText: removeNikkud(textVal),  // Generate clean text on the fly
            };
        });

        await insertMultiple(oramaDb.current, formattedVerses);
        
        console.log(`DEBUG: Orama initialized with ${formattedVerses.length} verses.`);
        setIsReady(true);
      } catch (e) {
        console.error('DEBUG: Failed to initialize Orama:', e);
      }
    }

    init();
  }, [db]);

  // --- SEARCH LOGIC ---
  useEffect(() => {
    async function runSearch() {
      if (!isReady || !oramaDb.current || !query || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      const cleanQuery = removeNikkud(query.trim());
      
      try {
        let navResult: SearchResult | null = null;
        let term = cleanQuery;
        let where: any = {}; 

        // --- A. NAVIGATION LOGIC ---
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);
        
        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            const parts = remainder.split(' ').filter(p => p.length > 0);
            
            if (parts.length <= 2) {
              const chapStr = parts[0];
              const verseStr = parts.length > 1 ? parts[1] : null;

              const chapNum = parseHebrewNumeral(chapStr);
              
              if (chapNum > 0) {
                // Check if exists in SQL to confirm it's valid
                let sql = '';
                let params: any[] = [];
                let isVerseSpecific = false;
                let verseNum = 0;

                if (verseStr) {
                  verseNum = parseHebrewNumeral(verseStr);
                  if (verseNum > 0) {
                     sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ? LIMIT 1`;
                     params = [book, chapNum, verseNum];
                     isVerseSpecific = true;
                  }
                }
                
                if (!sql && !verseStr) {
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? LIMIT 1`;
                   params = [book, chapNum];
                }

                if (sql) {
                  const row = await db.getFirstAsync<{מזהה: number, תוכן: string}>(sql, params);

                  if (row) {
                    navResult = {
                      type: 'verse',
                      id: `nav-${book}-${chapNum}-${verseStr || 'all'}`,
                      label: `${book} ${toHebrewNumeral(chapNum)}${isVerseSpecific ? ':' + toHebrewNumeral(verseNum) : ''}`,
                      subLabel: 'נווט למיקום זה',
                      data: {
                        id: isVerseSpecific ? row.מזהה : -1, 
                        book_name: book,
                        chapter: chapNum,
                        verse: isVerseSpecific ? verseNum : 1,
                        text: row.תוכן
                      }
                    };

                    // Switch to Strict Mode (Filter)
                    if (isVerseSpecific || (!verseStr && parts.length === 1)) {
                        console.log("DEBUG: Strict Mode ON");
                        term = ''; 
                        // FIX: Pass numbers as STRINGS to match Schema
                        where = {
                          book: book,
                          chapter: String(chapNum), 
                        };
                        if (isVerseSpecific) {
                            where.verse = String(verseNum);
                        }
                    }
                  }
                }
              }
            }
            break; 
          }
        }

        // --- B. ORAMA SEARCH ---
        if (!oramaDb.current) return;

        const safeTerm = term ?? ""; 

        // Sanitize Where Object
        const safeWhere = { ...where };
        Object.keys(safeWhere).forEach(key => {
            if (safeWhere[key] === undefined || safeWhere[key] === null) {
                delete safeWhere[key];
            }
        });

        console.log("DEBUG: Running Search...", { term: safeTerm, where: safeWhere });

        const searchResult: Results<typeof BIBLE_SCHEMA> = await search(oramaDb.current, {
          term: safeTerm,
          where: safeWhere,
          properties: ['cleanText', 'book', 'text'], 
          limit: 20,
          threshold: 0, // Lower threshold to ensure matches
          boost: { book: 2 },
        });

        const formattedResults: SearchResult[] = searchResult.hits.map(hit => ({
          type: 'verse',
          id: Number(hit.document.id),
          label: `${hit.document.book} ${toHebrewNumeral(Number(hit.document.chapter))}:${toHebrewNumeral(Number(hit.document.verse))}`,
          subLabel: hit.document.text,
          data: {
            id: Number(hit.document.id),
            book_name: hit.document.book,
            chapter: Number(hit.document.chapter),
            verse: Number(hit.document.verse),
            text: hit.document.text
          }
        }));

        if (navResult) {
          formattedResults.unshift(navResult);
        }

        setResults(formattedResults);
      } catch (e) {
        console.error('DEBUG: Search failed:', e);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, isReady]);

  return { results, loading, isReady };
}
