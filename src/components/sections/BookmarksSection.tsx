import { useState, useEffect } from 'react';
import { collection, query, documentId, where, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StudyMaterial, UserProfile } from '../../types';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Bookmark, FileText, FileType, Youtube, Loader2, Trash2, ArrowRight } from 'lucide-react';
import { User } from 'firebase/auth';

interface BookmarksSectionProps {
  user: User;
  setActiveTab: (tab: string) => void;
}

export function BookmarksSection({ user, setActiveTab }: BookmarksSectionProps) {
  const [bookmarkedMaterials, setBookmarkedMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const unsubUser = onSnapshot(doc(db, 'Users', user.uid), async (userDoc) => {
      const userData = userDoc.data() as UserProfile;
      const bookmarks = userData?.bookmarks || [];
      
      if (bookmarks.length === 0) {
        setBookmarkedMaterials([]);
        setLoading(false);
        return;
      }
      
      try {
        const chunks = [];
        for (let i = 0; i < bookmarks.length; i += 10) {
          chunks.push(bookmarks.slice(i, i + 10));
        }
        
        let allMaterials: StudyMaterial[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'StudyMaterials'), where(documentId(), 'in', chunk));
          const snapshot = await getDocs(q);
          const docs = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as StudyMaterial));
          allMaterials = [...allMaterials, ...docs];
        }
        setBookmarkedMaterials(allMaterials);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubUser();
  }, [user]);

  const removeBookmark = async (materialId: string) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'Users', user.uid);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const data = userDoc.data() as UserProfile;
        const bookmarks = data.bookmarks || [];
        await updateDoc(userRef, {
          bookmarks: bookmarks.filter(id => id !== materialId)
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const navigateToMaterial = (material: StudyMaterial) => {
    if (material.type === 'PDF') setActiveTab('pdf');
    if (material.type === 'Video') setActiveTab('video');
    if (material.type === 'Note' || material.type === 'CreatePDF') setActiveTab('notes');
  };

  return (
    <div className="w-full space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
            <Bookmark className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            Saved Bookmarks
          </h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 min-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center h-64 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
          </div>
        ) : bookmarkedMaterials.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No bookmarks yet</h3>
            <p className="text-slate-500 max-w-sm">
              Save your favorite PDFs, Notes, and Videos to access them quickly from here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarkedMaterials.map(material => (
              <div key={material.id} className="flex flex-col p-4 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-amber-400 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg shrink-0 ${
                    material.type === 'PDF' ? 'bg-red-100 text-red-600' : 
                    material.type === 'Video' ? 'bg-rose-100 text-rose-600' : 
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {material.type === 'PDF' && <FileText className="w-5 h-5" />}
                    {material.type === 'Video' && <Youtube className="w-5 h-5" />}
                    {(material.type === 'Note' || material.type === 'CreatePDF') && <FileType className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2">{material.title}</h3>
                    <p className="text-xs font-medium text-slate-500 mt-1">{material.class} • {material.subject}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                  <button 
                    onClick={() => removeBookmark(material.id)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-2"
                    title="Remove Bookmark"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => navigateToMaterial(material)}
                    className="flex items-center gap-1 text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                  >
                    Open <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
