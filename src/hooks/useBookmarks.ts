import { useState, useEffect } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { User } from 'firebase/auth';
import { UserProfile } from '../types';

export function useBookmarks(user: User | undefined) {
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'Users', user.uid), (doc) => {
      const data = doc.data() as UserProfile;
      setBookmarks(data?.bookmarks || []);
    });
    return () => unsub();
  }, [user]);

  const toggleBookmark = async (materialId: string) => {
    if (!user) return;
    const userRef = doc(db, 'Users', user.uid);
    if (bookmarks.includes(materialId)) {
      await updateDoc(userRef, {
        bookmarks: arrayRemove(materialId)
      });
    } else {
      await updateDoc(userRef, {
        bookmarks: arrayUnion(materialId)
      });
    }
  };

  return { bookmarks, toggleBookmark };
}
