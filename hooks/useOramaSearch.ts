import { parseHebrewNumeral, toHebrewNumeral } from '@/utils/hebrewNumerals';
import { create, insertMultiple, search } from '@orama/orama';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

// Use 'string' for everything to prevent TypeErrors
const BIBLE_SCHEMA = {
  id: 'string',
  book: 'string',
  chapter: 'string', 
  verse: 'string',   
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

function removeNikkud(text: string): string {
  return text ? text.replace(/[\u0591-\u05C7]/g, "") : "";
}

// Improved Regex: Handles spaces/colons/dashes more reliably
function parseLocation(input: string) {
  if (!input || !input.trim()) return null;

  const cleanInput = input.trim();

  // Regex Breakdown:
  // ^([א-ת"']+)       -> Group 1: Chapter (Hebrew letters/quotes)
  // (?:[\s:]+         -> Separator: Space or Colon
  //   ([א-ת"']+)      -> Group 2: Start Verse
  //   (?:[\s\-]+      -> Separator: Space or Dash
  //     ([א-ת"']+)    -> Group 3: End Verse
  //   )?              -> End Verse is optional
  // )?                -> Verse part is optional
  // $                 -> End of string
  const match = cleanInput.match(/^([א-ת"']+)(?:[\s:]+([א-ת"']+)(?:[\s\-]+([א-ת"']+))?)?$/);

  if (!match) return null;

  return {
    chapterStr: match[1],
    verseStartStr: match[2],
    verseEndStr: match[3]
  };
}

export function useOramaSearch(query: string) {
  const db = useSQLiteContext();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
   
  const oramaDb = useRef<any>(null);
  const allBooksRef = useRef<string[]>([]);

  useEffect(() => {
    async function init() {
      if (oramaDb.current) return;
      try {
        const bookRows = await db.getAllAsync<{שם: string}>('SELECT שם FROM ספרים ORDER BY מזהה ASC');
        allBooksRef.current = bookRows.map(b => b.שם);

        oramaDb.current = await create({ schema: BIBLE_SCHEMA });

        const allVerses = await db.getAllAsync(`
          SELECT 
            p.מזהה as id, 
            s.שם as book, 
            p.פרק as chapter, 
            p.פסוק as verse, 
            p.תוכן as text
          FROM פסוקים p 
          JOIN ספרים s ON p.מזהה_ספר = s.מזהה
        `);

        const formattedVerses = allVerses.map(v => {
            const textVal = v.text || '';
            return {
                id: String(v.id || ''), 
                book: v.book || '',
                chapter: String(v.chapter || '0'),
                verse: String(v.verse || '0'),
                text: textVal,
                cleanText: removeNikkud(textVal),
            };
        });

        await insertMultiple(oramaDb.current, formattedVerses);
        setIsReady(true);
      } catch (e) {
        console.error('Orama init failed:', e);
      }
    }
    init();
  }, [db]);

  useEffect(() => {
    async function runSearch() {
      // Allow single character search for "א" if needed, but usually 2 is better.
      // If debugging "triggers", lowering to 1 can help confirm it runs.
      if (!isReady || !oramaDb.current || !query || query.length < 1) {
        setResults([]);
        return;
      }

      setLoading(true);
      const cleanQuery = removeNikkud(query.trim());
      
      try {
        const navResults: SearchResult[] = [];
        let term = cleanQuery;
        
        // Sort books by length (desc) so "3 John" is checked before "John"
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);
        
        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            const parsed = parseLocation(remainder);

            if (parsed) {
              const chapNum = parseHebrewNumeral(parsed.chapterStr);
              const verseStartNum = parsed.verseStartStr ? parseHebrewNumeral(parsed.verseStartStr) : 0;
              const verseEndNum = parsed.verseEndStr ? parseHebrewNumeral(parsed.verseEndStr) : 0;

              if (chapNum > 0) {
                let sql = '';
                let params: any[] = [];
                
                if (verseStartNum > 0) {
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ? LIMIT 1`;
                   params = [book, chapNum, verseStartNum];
                } else {
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? LIMIT 1`;
                   params = [book, chapNum];
                }

                if (sql) {
                  const row = await db.getFirstAsync<{מזהה: number, תוכן: string}>(sql, params);

                  if (row) {
                    const navId = `nav-${book}-${chapNum}-${verseStartNum || 1}-${verseEndNum || 'end'}`;
                    
                    let label = `${book} ${toHebrewNumeral(chapNum)}`;
                    if (verseStartNum > 0) {
                        label += `:${toHebrewNumeral(verseStartNum)}`;
                        if (verseEndNum > 0) {
                            label += `-${toHebrewNumeral(verseEndNum)}`;
                        }
                    }

                    navResults.push({
                      type: 'verse',
                      id: navId,
                      label: label,
                      subLabel: 'נווט וסמן טווח', 
                      data: {
                        id: verseStartNum > 0 ? row.מזהה : -1,
                        book_name: book,
                        chapter: chapNum,
                        verse: verseStartNum > 0 ? verseStartNum : 1,
                        endVerse: verseEndNum > 0 ? verseEndNum : null, 
                        text: row.תוכן
                      }
                    });
                  }
                }
              }
            }
            // CRITICAL FIX: Removed 'break' here.
            // This allows checking "John" (matching John 3) even after matching "3 John".
          }
        }

        // If we found strict navigation results (e.g., "John 3"), we typically hide generic text search results
        // to avoid noise, unless no nav results were found.
        if (navResults.length > 0) {
             term = ""; 
        }

        // --- ORAMA SEARCH ---
        let formattedResults: SearchResult[] = [];
        
        if (term && term.length >= 2 && oramaDb.current) {
            const searchResult = await search(oramaDb.current, {
              term: term,
              properties: ['cleanText', 'book', 'text'], 
              limit: 20,
              threshold: 0,
              boost: { book: 2 },
            });

            formattedResults = searchResult.hits.map(hit => ({
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
        }

        setResults([...navResults, ...formattedResults]);

      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }

    const timeout = setTimeout(runSearch, 300);
    return () => clearTimeout(timeout);
  }, [query, isReady]);

  return { results, loading, isReady };
}
