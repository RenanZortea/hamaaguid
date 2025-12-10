import json
import sqlite3
import os

# Configuration
json_filename = 'Hebrew_Tanakh_Delitchz.json'
db_filename = 'tanakh.db'

def clean_text(text):
    if not text:
        return ""
    
    # 1. ONLY Fix the broken HTML spaces
    text = text.replace('&nbsp;', ' ')
    
    # 2. Fix other potential HTML entities (just in case)
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    
    # Note: We are NOT removing '׀' (The Hebrew Paseq) anymore.
    
    # 3. Clean up extra whitespaces created by the replacement
    return " ".join(text.split())

def create_database():
    if not os.path.exists(json_filename):
        print(f"Error: The file '{json_filename}' was not found.")
        return

    print("Loading JSON data...")
    with open(json_filename, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Remove old database to ensure fresh start
    if os.path.exists(db_filename):
        try:
            os.remove(db_filename)
            print(f"Old {db_filename} removed.")
        except PermissionError:
            print(f"Error: Could not delete {db_filename}. Please close any app using it.")
            return

    print("Creating corrected SQLite database (keeping Hebrew Paseq)...")
    conn = sqlite3.connect(db_filename)
    cursor = conn.cursor()

    # Create Tables
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ספרים (
            מזהה INTEGER PRIMARY KEY,
            שם TEXT,
            שם_קצר TEXT,
            תיאור TEXT
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS פסוקים (
            מזהה INTEGER PRIMARY KEY AUTOINCREMENT,
            מזהה_ספר INTEGER,
            פרק INTEGER,
            פסוק INTEGER,
            תוכן TEXT,
            כותרת TEXT,
            FOREIGN KEY(מזהה_ספר) REFERENCES ספרים(מזהה)
        )
    ''')

    # Insert Data
    books = data.get('book', {})
    sorted_book_ids = sorted(books.keys(), key=lambda x: int(x))

    for book_id_str in sorted_book_ids:
        book_id = int(book_id_str)
        book_data = books[book_id_str]
        
        info = book_data.get('info', {})
        # Clean book names too, just to be safe
        name = clean_text(info.get('name', ''))
        short_name = clean_text(info.get('shortname', ''))
        desc = clean_text(info.get('desc', ''))
        
        cursor.execute('INSERT INTO ספרים (מזהה, שם, שם_קצר, תיאור) VALUES (?, ?, ?, ?)', 
                       (book_id, name, short_name, desc))
        
        print(f"Processing: {name}")

        chapters = book_data.get('chapter', {})
        sorted_chapter_ids = sorted(chapters.keys(), key=lambda x: int(x))

        for chap_id_str in sorted_chapter_ids:
            chap_num = int(chap_id_str)
            chap_data = chapters[chap_id_str]
            
            verses = chap_data.get('verse', {})
            sorted_verse_ids = sorted(verses.keys(), key=lambda x: int(x))

            for verse_id_str in sorted_verse_ids:
                verse_num = int(verse_id_str)
                verse_data = verses[verse_id_str]
                
                # Apply the smart cleaning
                raw_text = verse_data.get('text', '')
                clean_content = clean_text(raw_text)
                
                raw_title = verse_data.get('title', '')
                clean_title = clean_text(raw_title)
                
                cursor.execute('''
                    INSERT INTO פסוקים (מזהה_ספר, פרק, פסוק, תוכן, כותרת) 
                    VALUES (?, ?, ?, ?, ?)
                ''', (book_id, chap_num, verse_num, clean_content, clean_title))

    conn.commit()
    conn.close()
    print(f"Done! Database regenerated at '{db_filename}'")

if __name__ == "__main__":
    create_database()
