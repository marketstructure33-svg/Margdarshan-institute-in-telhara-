import { useState } from 'react';
import { ExternalLink, X, FileText, ArrowLeft, Shield } from 'lucide-react';

interface FooterProps {
  setIsAdminAuthorized: (val: boolean) => void;
  setCurrentView: (view: 'user' | 'admin') => void;
}

export default function Footer({ setIsAdminAuthorized, setCurrentView }: FooterProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === "Abhishek bhaiya ka student VISHAL") {
      setIsAdminAuthorized(true);
      sessionStorage.setItem('margdarshan_admin_auth', 'true');
      setCurrentView('admin');
      setShowAdminModal(false);
      setAdminPassword('');
    } else {
      alert("❌ Access Denied. Incorrect Security PIN.");
    }
  };

  return (
    <>
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-4">
            <div className="text-center md:text-left space-y-1">
              <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight">Contact Us</h3>
              <p className="text-sm text-slate-500 font-medium">Run by: Abhishek Kumar</p>
              <p className="text-sm text-slate-500">For Class : VIIIth to General Competition</p>
              <div className="pt-2 text-sm text-slate-600">
                <p><strong>पता :-</strong> बाकरगंज, तेल्हाड़ा (नालन्दा)</p>
                <p><strong>Mob.:</strong> 9546617325, 9110138455</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <a 
                href="https://www.facebook.com/share/14qqdEbMy1U/" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-blue-600 transition-colors"
              >
                Facebook <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href="https://play.google.com/store/apps/details?id=co.shield.iomer" 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-emerald-600 transition-colors"
              >
                App <ExternalLink className="w-3 h-3" />
              </a>
              <button 
                onClick={() => setShowPrivacy(true)}
                className="flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 transition-colors underline"
              >
                Privacy Policy <FileText className="w-3 h-3" />
              </button>
              <button 
                onClick={() => setShowAdminModal(true)}
                className="flex items-center gap-1 text-sm text-slate-400 hover:text-red-600 transition-colors"
              >
                Admin <Shield className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>

      {showAdminModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Admin Authentication</h3>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm">Please enter the restricted security PIN to access the administration dashboard.</p>
            
            <form onSubmit={handleAdminSubmit}>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Enter Secret Password"
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 mb-6 focus:ring-2 focus:ring-red-500 outline-none dark:text-white"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAdminModal(false); setAdminPassword(''); }}
                  className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors"
                >
                  Unlock Panel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 z-[100] bg-slate-50 flex flex-col h-[100dvh]">
          <div className="bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 shadow-sm z-10">
            <button 
              onClick={() => setShowPrivacy(false)}
              className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-md font-medium hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </button>
            <h2 className="text-xl font-bold text-slate-800">Privacy Policy</h2>
            <div className="w-24"></div> {/* Spacer for centering */}
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 md:p-12">
            <div className="max-w-3xl mx-auto prose prose-slate">
              <h3>Margdarshan Institute Telhara - Data Protection & Student Privacy</h3>
              <p>Last updated: July 2026</p>
              <p>
                Welcome to Margdarshan Institute Telhara. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our application and tell you about your privacy rights.
              </p>
              <h4>1. The data we collect about you</h4>
              <p>
                We may collect, use, store and transfer different kinds of personal data about you which we have grouped together as follows:
                <br/>- <strong>Identity Data</strong> includes first name, last name, username or similar identifier, and your Google Profile avatar.
                <br/>- <strong>Contact Data</strong> includes email address and residential address.
                <br/>- <strong>Educational Data</strong> includes your class, roll number, and father's name.
              </p>
              <h4>2. How is your personal data collected?</h4>
              <p>We use different methods to collect data from and about you including through direct interactions when you create an account or update your profile.</p>
              <h4>3. How we use your personal data</h4>
              <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data to provide you with study materials and facilitate communication with institutional administrators.</p>
            </div>
          </div>
          
          <div className="bg-white border-t border-slate-200 p-4 flex justify-center sticky bottom-0 z-10">
            <button 
              onClick={() => setShowPrivacy(false)}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-md font-bold hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" /> Back to Home
            </button>
          </div>
        </div>
      )}
    </>
  );
}
