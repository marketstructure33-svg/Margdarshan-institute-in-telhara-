import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { BookOpen } from 'lucide-react';

export default function AuthScreen() {
  const handleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.warn('Error signing in with Google', error);
      if (error.code === 'auth/unauthorized-domain') {
        alert('Firebase Configuration Error:\n\nPlease add this domain to your Firebase Authorized Domains list in the Firebase Console -> Authentication -> Settings -> Authorized Domains.\n\nThe domain to add is:\nais-pre-i5kzaigk27p5xd7ilfasje-45190044130.asia-southeast1.run.app\n(and also add ais-dev-i5kzaigk27p5xd7ilfasje-45190044130.asia-southeast1.run.app)');
      } else if (error.message && error.message.includes('cross-origin')) {
        alert('Sign in failed due to browser iframe restrictions.\n\nPlease open this app in a new tab or window to sign in.');
      } else {
        alert('Failed to sign in: ' + error.message + '\n\nIf you are using this in a shared link, please try opening it in a new tab directly using the app URL.');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
        <div className="mx-auto w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
          <BookOpen className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Margdarshan Institute Telhara</h1>
        <p className="text-slate-500 mb-8">Welcome back. Please sign in to access your study materials and dashboard.</p>
        
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium py-3 px-4 rounded-xl transition-colors"
        >
          <img referrerPolicy="no-referrer" src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
