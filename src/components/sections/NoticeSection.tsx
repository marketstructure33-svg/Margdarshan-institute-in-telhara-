import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Notice } from '../../types';

export default function NoticeSection({ user }: { user: User }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  
  useEffect(() => {
    // Fetch notices
    const q = query(collection(db, 'Notices'), orderBy('timestamp', 'desc'), limit(15));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(results);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] min-h-[600px] w-full max-w-4xl mx-auto">
      <div className="flex flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex-1">
        <div className="bg-emerald-600 p-4 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">📢 Institutional Notices</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900">
          {notices.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 text-center py-8">No recent notices.</p>
          ) : (
            notices.map(notice => (
              <div key={notice.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2">{notice.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 text-base whitespace-pre-wrap">{notice.content}</p>
                <p className="text-xs text-slate-400 mt-4">{new Date(notice.timestamp).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
