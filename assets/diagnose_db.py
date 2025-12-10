import sqlite3

# Name of your database file
db_filename = 'tanakh.db'

def inspect_verses():
    print(f"--- Connecting to {db_filename} ---")
    try:
        conn = sqlite3.connect(db_filename)
        cursor = conn.cursor()
        
        # Query specific verses: Genesis (Book 1), Chapter 1, Verses 5 and 10
        # Adjust these numbers if your book IDs are different
        query = "SELECT מזהה_ספר, פרק, פסוק, תוכן FROM פסוקים WHERE מזהה_ספר=1 AND פרק=1 AND פסוק IN (5, 10)"
        
        cursor.execute(query)
        rows = cursor.fetchall()
        
        if not rows:
            print("No rows found! Check if the database exists or if Book IDs match.")
            return

        print(f"{'Verse':<15} | {'Content Preview'}")
        print("-" * 60)

        for row in rows:
            book_id, chap, verse, content = row
            ref = f"Book {book_id} {chap}:{verse}"
            
            print(f"\nREFERENCE: {ref}")
            print(f"DISPLAY:   {content}")
            print(f"DEBUG (repr): {repr(content)}")
            
            # detailed character breakdown for the "mark"
            print("CHARACTERS:")
            for char in content:
                # Filter to show only punctuation/symbols that might be the issue
                if not char.isalnum() and char != ' ':
                    print(f"  '{char}' -> Name: {get_char_name(char)} (U+{ord(char):04X})")

    except sqlite3.Error as e:
        print(f"Database Error: {e}")
    finally:
        if conn:
            conn.close()

def get_char_name(char):
    import unicodedata
    try:
        return unicodedata.name(char)
    except ValueError:
        return "UNKNOWN"

if __name__ == "__main__":
    inspect_verses()
