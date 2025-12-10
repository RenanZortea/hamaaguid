import sqlite3
import re

# Range for Hebrew Vowels (Nikkud) and Cantillation (Trop)
# Unicode: 0591 to 05C7
NIKKUD_PATTERN = re.compile(r'[\u0591-\u05C7]')

def remove_nikkud(text):
    if not text:
        return ""
    return re.sub(NIKKUD_PATTERN, '', text)

def upgrade_database():
    db_path = 'tanakh.db' # Make sure this points to your actual DB file
    print(f"Connecting to {db_path}...")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add the clean_text column if it doesn't exist
    try:
        cursor.execute("ALTER TABLE פסוקים ADD COLUMN clean_text TEXT")
        print("Added 'clean_text' column.")
    except sqlite3.OperationalError:
        print("'clean_text' column already exists. Updating data...")

    # 2. Add the clean_text column for Books (optional, if you want searchable book names)
    try:
        cursor.execute("ALTER TABLE ספרים ADD COLUMN name_clean TEXT")
         # Assuming 'ספרים' table exists and has a name column. 
         # Based on your logs it seems 'ספרים' has 'שם'.
    except sqlite3.OperationalError:
        pass

    # 3. Fetch all verses, strip nikkud, and update
    print("Fetching all verses...")
    cursor.execute("SELECT מזהה, תוכן FROM פסוקים")
    rows = cursor.fetchall()

    print(f"Processing {len(rows)} verses... this may take a moment.")
    
    updates = []
    for row in rows:
        verse_id = row[0]
        original_text = row[1]
        cleaned = remove_nikkud(original_text)
        updates.append((cleaned, verse_id))

    # Bulk update for performance
    cursor.executemany("UPDATE פסוקים SET clean_text = ? WHERE מזהה = ?", updates)
    
    conn.commit()
    print("Verses updated successfully.")

    # 4. Verify
    cursor.execute("SELECT תוכן, clean_text FROM פסוקים WHERE מזהה=1")
    sample = cursor.fetchone()
    print(f"\nVerification:\nOriginal: {sample[0]}\nClean:    {sample[1]}")

    conn.close()

if __name__ == "__main__":
    upgrade_database()
