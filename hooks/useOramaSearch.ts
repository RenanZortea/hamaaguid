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

// Helper to handle both "Chapter Verse" (space) and "Chapter:Verse" (colon)
function parseLocation(input: string) {
  // Remove spaces around separators to normalize: "א : ב - ג" -> "א:ב-ג"
  const normalized = input.replace(/\s*([:\-])\s*/g, '$1');
  
  // Regex to match: Chapter(:Verse(-EndVerse)?)?
  // Group 1: Chapter
  // Group 2: Start Verse (optional)
  // Group 3: End Verse (optional)
  const match = normalized.match(/^([א-ת"']+)(?::([א-ת"']+)(?:-([א-ת"']+))?)?$/);

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
        
        // --- UPGRADED NAVIGATION LOGIC ---
        const sortedBooks = [...allBooksRef.current].sort((a, b) => b.length - a.length);
        
        for (const book of sortedBooks) {
          if (cleanQuery.startsWith(book)) {
            const remainder = cleanQuery.slice(book.length).trim();
            
            // USE THE NEW PARSER
            const parsed = parseLocation(remainder);

            if (parsed) {
              const chapNum = parseHebrewNumeral(parsed.chapterStr);
              const verseStartNum = parsed.verseStartStr ? parseHebrewNumeral(parsed.verseStartStr) : 0;
              const verseEndNum = parsed.verseEndStr ? parseHebrewNumeral(parsed.verseEndStr) : 0;

              if (chapNum > 0) {
                // Determine what SQL to run based on what we parsed
                let sql = '';
                let params: any[] = [];
                
                if (verseStartNum > 0) {
                   // Fetch the START verse text to show in the preview
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? AND p.פסוק = ? LIMIT 1`;
                   params = [book, chapNum, verseStartNum];
                } else {
                   // Just Chapter
                   sql = `SELECT p.מזהה, p.תוכן FROM פסוקים p JOIN ספרים s ON p.מזהה_ספר = s.מזהה WHERE s.שם = ? AND p.פרק = ? LIMIT 1`;
                   params = [book, chapNum];
                }

                if (sql) {
                  const row = await db.getFirstAsync<{מזהה: number, תוכן: string}>(sql, params);

                  if (row) {
                    // Create a unique ID for the result item
                    const navId = `nav-${book}-${chapNum}-${verseStartNum || 1}-${verseEndNum || 'end'}`;
                    
                    // Format the Label (e.g., "יוחנן א:א-ב")
                    let label = `${book} ${toHebrewNumeral(chapNum)}`;
                    if (verseStartNum > 0) {
                        label += `:${toHebrewNumeral(verseStartNum)}`;
                        if (verseEndNum > 0) {
                            label += `-${toHebrewNumeral(verseEndNum)}`;
                        }
                    }

                    navResult = {
                      type: 'verse',
                      id: navId,
                      label: label,
                      subLabel: 'נווט וסמן טווח', // "Navigate and Highlight Range"
                      data: {
                        id: verseStartNum > 0 ? row.מזהה : -1,
                        book_name: book,
                        chapter: chapNum,
                        verse: verseStartNum > 0 ? verseStartNum : 1,
                        // THIS IS THE KEY: Pass the end verse in data
                        endVerse: verseEndNum > 0 ? verseEndNum : null, 
                        text: row.תוכן
                      }
                    };

                    // STRICT MODE: If we have specific coordinates, hide other fuzzy search results
                    console.log("DEBUG: Navigation Range Detected");
                    term = ''; // Clear search term to hide unrelated results
                    
                    // We can also filter the "List" to show only these verses if you want
                    // But usually for navigation, you just show the one "Go To" button.
                  }
                }
              }
            }
            break; // Stop checking other books
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
