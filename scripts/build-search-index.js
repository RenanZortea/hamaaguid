const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
// Use the CJS bundle to avoid import.meta issues even in Node
const FlexSearch = require('flexsearch');

const DB_PATH = path.join(__dirname, '../assets/tanakh.db');
const OUTPUT_PATH = path.join(__dirname, '../assets/search-index.json');

function buildIndex() {
  console.log('Opening database:', DB_PATH);
  if (!fs.existsSync(DB_PATH)) {
    console.error('Error: Database file not found!');
    process.exit(1);
  }

  const db = new Database(DB_PATH, { readonly: true });
  
  // Initialize FlexSearch with SAME config as the app
  const index = new FlexSearch.Document({
    id: "id",
    index: ["cleanText"], // Only index clean text for speed/size
    tokenize: "forward",
    context: false,
    cache: true,
    worker: false
  });

  console.log('Reading verses from DB...');
  const verses = db.prepare(`
    SELECT 
      p.מזהה as id, 
      s.שם as book, 
      p.פרק as chapter, 
      p.פסוק as verse, 
      p.תוכן as text,
      p.clean_text as cleanText
    FROM פסוקים p 
    JOIN ספרים s ON p.מזהה_ספר = s.מזהה
  `).all();

  console.log(`Indexing ${verses.length} verses...`);
  console.time('Indexing');
  
  verses.forEach(v => {
    // We only need to index the SEARCHABLE fields.
    // The "Store" (data to display) is separate in the app or can be embedded.
    // To keep the JSON small, FlexSearch export only contains the index structure.
    // However, FlexSearch Document store doesn't easily export the 'store'.
    // 
    // Optimization: We ONLY export the index. The app still has the DB. 
    // When search matches "ID 123", the app can look up ID 123 in the DB (fast single lookups) 
    // OR we can create a side-car JSON for the content if DB lookups are too slow.
    // 
    // Given 30k verses, a full content JSON is ~5-10MB.
    // Let's try to just export the INDEX first.
    
    index.add({
        id: v.id,
        cleanText: v.cleanText
    });
  });
  
  console.timeEnd('Indexing');

  console.log('Exporting index...');
  index.export((key, data) => {
    // FlexSearch export is async-ish or callback based for parts
    // But index.export(handler) calls handler for each part.
    // We want to verify how to save it completely.
    // Actually detailed documentation says: index.export() returns a promise or callback.
    // If we use the callback, it gives key/data pairs we need to save.
    // We will save them to a single object map.
  });

  // Export to single object
  // The 'export' method with a callback is for async streams.
  // We can use sync export if we just call it without args? No.
  // Let's use the promise / accumulation pattern.
  
  const exportData = {};
  index.export((key, data) => {
      exportData[key] = data;
  });

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(exportData));
  console.log(`Saved index to ${OUTPUT_PATH} (${(fs.statSync(OUTPUT_PATH).size / 1024 / 1024).toFixed(2)} MB)`);
  db.close();
}

buildIndex();
