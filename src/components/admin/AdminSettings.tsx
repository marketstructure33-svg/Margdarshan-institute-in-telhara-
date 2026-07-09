import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, storage } from '../../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';


import { Upload, Image as ImageIcon, Loader2, Save, CheckCircle2, Settings } from 'lucide-react';

export default function AdminSettings() {
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const [adminApiKey, setAdminApiKey] = useState('');
  const [userChatApiKey, setUserChatApiKey] = useState('');
  const [userPlannerApiKey, setUserPlannerApiKey] = useState('');

  
  
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const docRef = doc(db, 'Settings', 'appSettings');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logoUrl) setLogoUrl(data.logoUrl);
        if (data.bannerUrl) setBannerUrl(data.bannerUrl);
      }
      
      const keysRef = doc(db, 'Settings', 'apiKeys');
      const keysSnap = await getDoc(keysRef);
      if (keysSnap.exists()) {
        const data = keysSnap.data();
        if (data.adminApiKey) setAdminApiKey(data.adminApiKey);
        if (data.userChatApiKey) setUserChatApiKey(data.userChatApiKey);
        if (data.userPlannerApiKey) setUserPlannerApiKey(data.userPlannerApiKey);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  

  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (type === 'logo') setUploadingLogo(true);
    else setUploadingBanner(true);
    try {
      const storageRef = ref(storage, `settings/${type}_${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error("Upload error:", error);
          if (type === 'logo') setUploadingLogo(false);
          else setUploadingBanner(false);
          alert("Error uploading file");
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          if (type === 'logo') setLogoUrl(downloadURL);
          else setBannerUrl(downloadURL);
          if (type === 'logo') setUploadingLogo(false);
          else setUploadingBanner(false);
        }
      );
    } catch (error) {
      console.error("Error setting up upload:", error);
      if (type === 'logo') setUploadingLogo(false);
      else setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setSuccess('');
    try {
      await setDoc(doc(db, 'Settings', 'appSettings'), {
        logoUrl,
        bannerUrl,
        updatedAt: Date.now()
      }, { merge: true });
      
      await setDoc(doc(db, 'Settings', 'apiKeys'), {
        adminApiKey,
        userChatApiKey,
        userPlannerApiKey,
        updatedAt: Date.now()
      }, { merge: true });
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-200">
      <div className="bg-slate-900 p-6 text-white border-b-4 border-red-500">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="w-6 h-6 text-red-400" />
          App Settings (Images)
        </h2>
        <p className="text-slate-400 mt-1">Manage logo and banner images</p>
      </div>

      <div className="p-6 space-y-8">
        {success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-xl border border-green-200 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        {/* Logo Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-slate-500" />
            Brand Logo
          </h3>
          <div className="flex gap-4 items-start">
            <div className="w-24 h-24 rounded-full border-2 border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
              <img src={logoUrl || '/unnamed.png'} referrerPolicy="no-referrer" alt="Logo Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/unnamed.png'; }} />
            </div>
            <div className="flex-1 space-y-3">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Logo URL</label>
                <input 
                  type="text" 
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">OR</span>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingLogo ? 'Uploading...' : 'Upload File'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} disabled={uploadingLogo} />
                </label>
              </div>
              
            </div>
          </div>
        </div>

        <hr className="border-slate-100" />

        {/* Banner Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-slate-500" />
            Home Banner Image
          </h3>
          <div className="flex gap-4 items-start flex-col sm:flex-row">
            <div className="w-full sm:w-64 h-32 rounded-xl border-2 border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
              <img src={bannerUrl || '/FB_IMG_1783150160395.jpg'} referrerPolicy="no-referrer" alt="Banner Preview" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/FB_IMG_1783150160395.jpg'; }} />
            </div>
            <div className="flex-1 space-y-3 w-full">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Banner URL</label>
                <input 
                  type="text" 
                  value={bannerUrl}
                  onChange={(e) => setBannerUrl(e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">OR</span>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
                  {uploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {uploadingBanner ? 'Uploading...' : 'Upload File'}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'banner')} disabled={uploadingBanner} />
                </label>
              </div>
              
            </div>
          </div>
        </div>

        
        <hr className="border-slate-100" />
        
        {/* API Keys Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            AI API Keys Configuration
          </h3>
          <p className="text-sm text-slate-500">Add your Gemini API Keys here. These keys will be used dynamically.</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Admin Panel (Research) API Key (e.g., Gemini, ChatGPT, Claude)</label>
              <input 
                type="text" 
                value={adminApiKey}
                onChange={(e) => setAdminApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">User Panel (AI Chat) API Key (e.g., Gemini, ChatGPT, Claude)</label>
              <input 
                type="text" 
                value={userChatApiKey}
                onChange={(e) => setUserChatApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">User Panel (Study Planner & Tutor) API Key (e.g., Gemini, ChatGPT, Claude)</label>
              <input 
                type="text" 
                value={userPlannerApiKey}
                onChange={(e) => setUserPlannerApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-50 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
            {loading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
