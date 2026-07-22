import { useState, useEffect } from 'react';

import { User } from 'firebase/auth';
import { Book, GraduationCap, ChevronRight, Clock, FileText, Download, Eye, Target, Presentation } from 'lucide-react';
import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
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
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [features, setFeatures] = useState({ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true });

  const [appBanner, setAppBanner] = useState('/FB_IMG_1783150160395.jpg');

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'Settings', 'appSettings'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().features) {
        setFeatures({ ...{ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true }, ...docSnap.data().features });
      }
    });

    const unsub2 = onSnapshot(doc(db, 'Settings', 'appSettings'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().bannerUrl) {
        setAppBanner(docSnap.data().bannerUrl);
      } else {
        setAppBanner('/FB_IMG_1783150160395.jpg');
      }
    });
    return () => {
      unsubSettings();
      unsub2();
    };
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

  
  useEffect(() => {
    if (!user) return;
    
    let unsubMaterials = () => {};
    let unsubUser = () => {};
    
    const setupProgress = () => {
      const q = query(
        collection(db, 'StudyMaterials'),
        where('class', '==', selectedClass),
        where('subject', '==', selectedSubject)
      );
      
      let totalMaterials = [];
      let completedIds = [];
      
      const calculateProgress = () => {
        const completedCount = totalMaterials.filter(id => completedIds.includes(id)).length;
        setProgress({ completed: completedCount, total: totalMaterials.length });
      };

      unsubMaterials = onSnapshot(q, (snapshot) => {
        totalMaterials = snapshot.docs.map(doc => doc.id);
        calculateProgress();
      });
      
      const userRef = doc(db, 'Users', user.uid);
      unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().completedMaterials) {
          completedIds = docSnap.data().completedMaterials;
        } else {
          completedIds = [];
        }
        calculateProgress();
      });
    };
    
    setupProgress();
    
    return () => {
      unsubMaterials();
      unsubUser();
    };
  }, [selectedClass, selectedSubject, user]);

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

      
      {/* Learning Progress */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-slate-800">
            <Target className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Learning Progress</h2>
          </div>
          <p className="text-sm text-slate-500">
            {selectedSubject} • {selectedClass}
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{progress.completed}</span>
            <span className="text-lg font-bold text-slate-400">/ {progress.total}</span>
            <span className="text-sm text-slate-500 ml-2">completed</span>
          </div>
        </div>
        
        <div className="relative w-24 h-24">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-slate-100 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <circle
              className="text-indigo-600 stroke-current transition-all duration-1000 ease-in-out"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 40}`}
              strokeDashoffset={`${2 * Math.PI * 40 - (progress.total > 0 ? (progress.completed / progress.total) * (2 * Math.PI * 40) : 0)}`}
              transform="rotate(-90 50 50)"
            ></circle>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-indigo-700">
              {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>


      {/* Quick Actions */}
      <div className="grid sm:grid-cols-3 gap-6">

        {features.video && (
        <button 
          onClick={() => setActiveTab('video')}
          className="group bg-gradient-to-br from-red-600 to-rose-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-200 transition-colors">Video Classes</h3>
          <p className="text-red-100 text-sm mb-4">Watch recorded lectures and YouTube tutorials.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Watch Videos <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}

        {features.pdf && (
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
      )}

        {features.notes && (
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
      )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        
        <button 
          onClick={() => setActiveTab('whiteboard')}
          className="group bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Presentation className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">Live Whiteboard</h3>
          <p className="text-blue-100 text-sm">Join live interactive whiteboard classes.</p>
        </button>
        {features.livetutor && (
        <button 
          onClick={() => setActiveTab('livetutor')}
          className="group bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">AI Live Tutor</h3>
          <p className="text-indigo-100 text-sm mb-4">Talk real-time with an AI tutor.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Start Live Session <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
        {features.analytics && (
        <button 
          onClick={() => setActiveTab('analytics')}
          className="group bg-gradient-to-br from-violet-600 to-fuchsia-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-fuchsia-200 transition-colors">Performance Analytics</h3>
          <p className="text-white text-sm mb-4">Predictive insights for students.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            View Analytics <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
        {features.schedule && (
        <button 
          onClick={() => setActiveTab('schedule')}
          className="group bg-gradient-to-br from-blue-600 to-cyan-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">Class Schedule</h3>
          <p className="text-white text-sm mb-4">View deadlines & sync with your calendar.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            View Schedule <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
        {features.quiz && (
        <button 
          onClick={() => setActiveTab('quiz')}
          className="group bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-200 transition-colors">AI Quiz Generator</h3>
          <p className="text-white text-sm mb-4">Generate quizzes from your study materials.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Start Quiz <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      )}
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
