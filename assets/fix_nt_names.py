import sqlite3

# CONFIGURATION
DB_PATH = 'tanakh.db'  # Change to 'bible.db' if that's what you use

def fix_nt_book_names():
    print(f"Connecting to {DB_PATH}...")
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
    except sqlite3.Error as e:
        print(f"Error connecting to database: {e}")
        return

    # Mapping: Old Name -> New Name
    # Based on your reader.tsx file
    replacements = {
        "1 קורינתיים": "קורינתיים א",
        "2 קורינתיים": "קורינתיים ב",
        "1 תסלוניקים": "תסלוניקים א",
        "2 תסלוניקים": "תסלוניקים ב",
        "1 טימותיאוס": "טימותיאוס א",
        "2 טימותיאוס": "טימותיאוס ב",
        "1 פטרוס": "פטרוס א",
        "2 פטרוס": "פטרוס ב",
        "1 יוחנן": "יוחנן א",
        "2 יוחנן": "יוחנן ב",
        "3 יוחנן": "יוחנן ג",
        # Add any others if needed
    }

    print("Updating Book Names in 'ספרים' table...")
    
    updates_count = 0
    for old_name, new_name in replacements.items():
        # Update the Books table (usually 'ספרים' or 'books')
        # We try to update both table names just in case
        
        # 1. Try 'ספרים' table (standard in your app)
        try:
            cursor.execute("UPDATE ספרים SET שם = ? WHERE שם = ?", (new_name, old_name))
            if cursor.rowcount > 0:
                print(f"  Changed '{old_name}' -> '{new_name}'")
                updates_count += 1
        except sqlite3.OperationalError:
            pass # Table might not exist

        # 2. Try 'books' table (common alternative)
        try:
            cursor.execute("UPDATE books SET name = ? WHERE name = ?", (new_name, old_name))
        except sqlite3.OperationalError:
            pass
            
        # 3. If you have a 'book_hebrew' column in 'verses'/'פסוקים' (from previous scripts)
        try:
            cursor.execute("UPDATE פסוקים SET book_hebrew = ? WHERE book_hebrew = ?", (new_name, old_name))
            cursor.execute("UPDATE verses SET book_hebrew = ? WHERE book_hebrew = ?", (new_name, old_name))
        except sqlite3.OperationalError:
            pass

    conn.commit()
    print(f"Update complete. Modified {updates_count} books.")
    
    # Verification
    print("\n--- Current NT Book Names (Sample) ---")
    try:
        cursor.execute("SELECT שם FROM ספרים WHERE שם LIKE '%קורינתיים%'")
        for row in cursor.fetchall():
            print(row[0])
    except:
        pass

    conn.close()

if __name__ == "__main__":
    fix_nt_book_names()
