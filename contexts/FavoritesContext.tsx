import { onAuthStateChanged, User } from 'firebase/auth';
import { collection, CollectionReference, deleteDoc, doc, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';

export interface FavoriteVerse {
  id: string; // Document ID (book_chapter_verseNumbers)
  book: string;
  chapter: number;
  verseNumbers: number[]; // Store actual verse numbers (e.g., 1, 2) instead of DB IDs
  createdAt: number;
  previewText?: string;
}

interface FavoritesContextType {
  favorites: FavoriteVerse[];
  loading: boolean;
  addToFavorites: (book: string, chapter: number, verseNumbers: number[], previewText?: string) => Promise<void>;
  removeFromFavorites: (id: string) => Promise<void>;
  isFavorite: (book: string, chapter: number, verseNumbers: number[]) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<FavoriteVerse[]>([]);
  const [loading, setLoading] = useState(true);

  // Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setFavorites([]);
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Monitor Favorites Collection
  useEffect(() => {
    if (!user) return;

    const favoritesRef = collection(db, 'users', user.uid, 'favorites') as CollectionReference<FavoriteVerse>;
    const q = query(favoritesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = snapshot.docs.map(doc => {
        const data = doc.data();
        // Safety check for legacy data using verseIds
        const verseNumbers = data.verseNumbers || data.verseIds || [];
        
        return { 
          ...data, 
          id: doc.id,
          verseNumbers // Ensure this property always exists
        };
      });
      setFavorites(favs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching favorites:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  const addToFavorites = async (book: string, chapter: number, verseNumbers: number[], previewText?: string) => {
    if (!user) return;

    // Create a unique ID from verse numbers
    const sortedNums = [...verseNumbers].sort((a, b) => a - b);
    const docId = `${book}_${chapter}_${sortedNums.join('-')}`;
    
    const favorite: FavoriteVerse = {
        id: docId,
        book,
        chapter,
        verseNumbers: sortedNums,
        createdAt: Date.now(),
        previewText
    };

    try {
        await setDoc(doc(db, 'users', user.uid, 'favorites', docId), favorite);
    } catch (e) {
        console.error("Error adding favorite:", e);
        throw e;
    }
  };

  const removeFromFavorites = async (id: string) => {
    if (!user) return;
    try {
        await deleteDoc(doc(db, 'users', user.uid, 'favorites', id));
    } catch (e) {
        console.error("Error removing favorite:", e);
        throw e;
    }
  };

  const isFavorite = (book: string, chapter: number, verseNumbers: number[]) => {
      const sortedNums = [...verseNumbers].sort((a, b) => a - b);
      const docId = `${book}_${chapter}_${sortedNums.join('-')}`;
      return favorites.some(f => f.id === docId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, loading, addToFavorites, removeFromFavorites, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
