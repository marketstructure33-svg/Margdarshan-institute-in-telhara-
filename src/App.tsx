/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AuthScreen from './components/Auth';
import UserPanel from './components/UserPanel';
import AdminPanel from './components/AdminPanel';
import Header from './components/Header';
import { Loader2 } from 'lucide-react';
import Footer from './components/Footer';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [currentView, setCurrentView] = useState<'user' | 'admin'>('user');
  const [activeTab, setActiveTab] = useState('home');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    // Check if admin is already authorized from session
    if (sessionStorage.getItem('margdarshan_admin_auth') === 'true') {
      setIsAdminAuthorized(true);
    }
    
    // Check theme from local storage
    const storedTheme = localStorage.getItem('margdarshan_theme');
    if (storedTheme === 'dark') {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';
      if (newTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('margdarshan_theme', newTheme);
      return newTheme;
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setLoading(false);
        try {
          // Create user profile if it doesn't exist
          const userRef = doc(db, 'Users', firebaseUser.uid);
          const docSnap = await getDoc(userRef);
          if (!docSnap.exists()) {
            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName,
              email: firebaseUser.email,
              photoURL: firebaseUser.photoURL,
              createdAt: Date.now()
            });
          }
        } catch (error: any) {
          console.warn("Firebase Database Warning:", error);
          if (error.message?.includes("offline")) {
            console.warn("Database connection failed. Please ensure Firestore is created and initialized in your Firebase Console.");
          }
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-50 font-sans transition-colors">
      <Header 
        isAdminAuthorized={isAdminAuthorized} 
        setIsAdminAuthorized={setIsAdminAuthorized}
        currentView={currentView}
        setCurrentView={setCurrentView}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentView === 'admin' && isAdminAuthorized ? (
          <AdminPanel />
        ) : (
          <UserPanel 
            user={user} 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            setIsAdminAuthorized={setIsAdminAuthorized}
            setCurrentView={setCurrentView}
          />
        )}
      </main>
    </div>
  );
}

