import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

import { BookOpen, Settings, LogOut, Menu, X, Moon, Sun } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface HeaderProps {
  isAdminAuthorized: boolean;
  setIsAdminAuthorized: (val: boolean) => void;
  currentView: 'user' | 'admin';
  setCurrentView: (view: 'user' | 'admin') => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const NAV_ITEMS = [
  { id: 'home', label: 'Home' },
  { id: 'pdf', label: 'P.D.F' },
  { id: 'notes', label: 'Notes' },
  { id: 'planner', label: 'AI Study Planner' },
  { id: 'livetutor', label: 'Live Tutor' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'notice', label: 'Notices' },
  { id: 'ai_chat', label: 'AI Tutor' },
  { id: 'admin_chat', label: 'Abhishek Bhaiya Chat' },
  { id: 'profile', label: 'Profile' },
];

export default function Header({ 

  isAdminAuthorized, 
  setIsAdminAuthorized, 
  currentView, 
  setCurrentView,
  activeTab,
  setActiveTab,
  theme,
  toggleTheme
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [appLogo, setAppLogo] = useState('/unnamed.png');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'Settings', 'appSettings'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().logoUrl) {
        setAppLogo(docSnap.data().logoUrl);
      } else {
        setAppLogo('/unnamed.png');
      }
    });
    return () => unsub();
  }, []);


  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0f172a] text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center gap-3 select-none">
            <div id="brand-logo" className="w-12 h-12 bg-white rounded-full flex items-center justify-center overflow-hidden shrink-0 shadow-sm border-2 border-slate-700 relative">
              <img referrerPolicy="no-referrer" 
                src={appLogo} 
                alt="Margdarshan Institute" 
                className="w-full h-full object-cover z-10 relative rounded-full"
                onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/unnamed.png'; }}
              />
            </div>
            <span className="text-xl md:text-2xl hidden sm:block tracking-wider font-sans font-black uppercase text-white drop-shadow-sm italic">
              MARGDARSHAN INSTITUTE
            </span>
          </div>

          {/* Desktop Navigation */}
          {currentView === 'user' && (
            <nav className="hidden md:flex space-x-1">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeTab === item.id 
                      ? 'bg-slate-800 text-emerald-400' 
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {currentView === 'admin' && (
            <div className="hidden md:flex items-center space-x-4">
              <span className="text-red-400 font-bold px-3 py-2">ADMINISTRATION DASHBOARD</span>
            </div>
          )}

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-300 hover:text-white rounded-full transition-colors"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAdminAuthorized && currentView === 'admin' && (
              <button
                onClick={() => setCurrentView('user')}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-md shadow-sm transition-colors"
              >
                <Settings className="w-4 h-4" />
                Exit Admin
              </button>
            )}
            
            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center gap-2 text-slate-300 hover:text-white"
            >
              <LogOut className="w-5 h-5" />
            </button>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-slate-300 hover:text-white p-2"
              >
                {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-800 border-t border-slate-700">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {currentView === 'user' ? NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  activeTab === item.id 
                    ? 'bg-slate-900 text-emerald-400' 
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            )) : (
              <div className="px-3 py-2 text-red-400 font-bold">ADMINISTRATION DASHBOARD</div>
            )}
            
            {isAdminAuthorized && currentView === 'admin' && (
              <button
                onClick={() => {
                  setCurrentView('user');
                  setIsMobileMenuOpen(false);
                }}
                className="block w-full text-left px-3 py-2 mt-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-md"
              >
                Exit Admin
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="block w-full text-left px-3 py-2 mt-2 text-slate-300 hover:bg-slate-700 hover:text-white font-medium rounded-md"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
