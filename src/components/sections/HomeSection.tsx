import { useState, useEffect } from 'react';

import { User } from 'firebase/auth';
import { Book, GraduationCap, ChevronRight, Clock, FileText, Download, Eye } from 'lucide-react';
import { doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { RecentView } from '../../types';

import Footer from '../Footer';

interface HomeSectionProps {
  user: User;
  selectedClass: string;
  setSelectedClass: (c: string) => void;
  selectedSubject: string;
  setSelectedSubject: (s: string) => void;
  setActiveTab: (tab: string) => void;
  setIsAdminAuthorized: (val: boolean) => void;
  setCurrentView: (view: 'user' | 'admin') => void;
}

const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Competitive'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Sanskrit', 'General', 'Hindi', 'English'];

export default function HomeSection({ 
  user, 
  selectedClass, 
  setSelectedClass, 
  selectedSubject, 
  setSelectedSubject,
  setActiveTab,
  setIsAdminAuthorized,
  setCurrentView
}: HomeSectionProps) {
  const [recentViews, setRecentViews] = useState<RecentView[]>([]);

  const [appBanner, setAppBanner] = useState('/FB_IMG_1783150160395.jpg');

  useEffect(() => {
    const unsub2 = onSnapshot(doc(db, 'Settings', 'appSettings'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().bannerUrl) {
        setAppBanner(docSnap.data().bannerUrl);
      } else {
        setAppBanner('/FB_IMG_1783150160395.jpg');
      }
    });
    return () => unsub2();
  }, []);


  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, 'Users', user.uid), async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.recentViews) {
          const views: RecentView[] = data.recentViews;
          
          // Verify existence of each view
          const validViews: RecentView[] = [];
          let changed = false;
          
          for (const view of views) {
            try {
              const materialRef = doc(db, 'StudyMaterials', view.id);
              const materialSnap = await getDoc(materialRef);
              if (materialSnap.exists()) {
                validViews.push(view);
              } else {
                changed = true; // It was deleted
              }
            } catch (e) {
              validViews.push(view); // On error, assume valid to avoid accidental deletion
            }
          }
          
          if (changed) {
            // Update user doc to remove deleted views
            try {
              await updateDoc(doc(db, 'Users', user.uid), { recentViews: validViews });
            } catch(e) {}
          }
          
          setRecentViews(validViews);
        }
      }
    });
    return () => unsub();
  }, [user]);

  return (
    <div className="space-y-8">
      {/* Institute Banner */}
      <div className="relative w-full h-64 sm:h-80 md:h-96 rounded-2xl overflow-hidden shadow-lg group">
        <img referrerPolicy="no-referrer" 
          src={appBanner} 
          alt="Margdarshan Institute Classroom" 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/FB_IMG_1783150160395.jpg'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
        <div className="absolute bottom-0 left-0 p-6 md:p-8 w-full">
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-2 shadow-sm">
            Empowering Minds, Shaping Futures
          </h2>
          <p className="text-slate-200 text-sm md:text-base font-medium max-w-2xl text-shadow-sm">
            Welcome to the digital learning platform of Margdarshan Institute Telhara. Excellence in education since 2012.
          </p>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-[#0f172a] rounded-2xl p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none">
          <Book className="w-64 h-64 -mt-12 -mr-12" />
        </div>
        <div className="relative z-10 flex items-center gap-6">
          <img referrerPolicy="no-referrer" 
            src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName || 'Student'}`} 
            alt="Profile" 
            className="w-20 h-20 rounded-full border-4 border-emerald-500 shadow-md object-cover bg-white"
          />
          <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user.displayName || 'Student'}</h1>
            <p className="text-emerald-400 font-medium text-lg">Let's continue your learning journey.</p>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <GraduationCap className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold">Select Class</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  selectedClass === c 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-800">
            <Book className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold">Select Subject</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SUBJECTS.map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSubject(s)}
                className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                  selectedSubject === s 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid sm:grid-cols-2 gap-6">
        <button 
          onClick={() => setActiveTab('pdf')}
          className="group bg-gradient-to-br from-[#0f172a] to-slate-800 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">Study P.D.F Materials</h3>
          <p className="text-slate-400 text-sm mb-4">View and download assignments and chapter PDFs.</p>
          <div className="flex items-center text-emerald-400 text-sm font-bold uppercase tracking-wider">
            Open Materials <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>

        <button 
          onClick={() => setActiveTab('notes')}
          className="group bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-slate-100 transition-colors">Chapter Notes & Rules</h3>
          <p className="text-emerald-100 text-sm mb-4">Read structured notes and formulas online.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Read Notes <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>

      {/* Recent Views */}
      {recentViews.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-200 p-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-800">
              <Clock className="w-5 h-5 text-emerald-600" />
              <h2 className="text-lg font-bold">Recently Viewed</h2>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {recentViews.map((item, index) => (
              <div key={index} className="p-4 sm:px-6 hover:bg-slate-50 transition-colors flex items-center gap-4">
                <div className={`p-2 rounded-lg shrink-0 ${item.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-800 truncate">{item.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.type} • {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                </div>
                {item.type === 'PDF' && item.url && (
                  <a 
                    href={item.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                    title="View PDF"
                  >
                    <Eye className="w-5 h-5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      <Footer setIsAdminAuthorized={setIsAdminAuthorized} setCurrentView={setCurrentView} />
    </div>
  );
}
