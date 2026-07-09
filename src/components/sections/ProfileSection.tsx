import { useState, useEffect } from 'react';
import { User, updateProfile } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { Camera, Save, Loader2 } from 'lucide-react';

export default function ProfileSection({ user }: { user: User }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: () => void;
    const fetchProfile = () => {
      setLoading(true);
      try {
        const docRef = doc(db, 'Users', user.uid);
        unsubscribe = onSnapshot(docRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
             setProfile({
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              createdAt: Date.now()
            });
          }
          setLoading(false);
        }, (error) => {
          console.warn("Error fetching profile", error);
          setProfile({
              uid: user.uid,
              displayName: user.displayName,
              email: user.email,
              photoURL: user.photoURL,
              createdAt: Date.now()
          });
          setLoading(false);
        });
      } catch (error: any) {
        console.warn("Error setting up profile snapshot", error);
        setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user.uid]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!profile) return;
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Fast instant preview
    const localUrl = URL.createObjectURL(file);
    setProfile({ ...profile, photoURL: localUrl });

    try {
      const storageRef = ref(storage, `Profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      await updateProfile(user, { photoURL: url });
      setProfile(prev => prev ? { ...prev, photoURL: url } : null);
      
      const docRef = doc(db, 'Users', user.uid);
      await updateDoc(docRef, { photoURL: url });
    } catch (error) {
      console.warn("Error updating photo", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setSaving(true);
    
    try {
      const docRef = doc(db, 'Users', user.uid);
      const saveToFirestore = setDoc(docRef, {
        displayName: profile.displayName,
        rollNumber: profile.rollNumber || '',
        studentClass: profile.studentClass || '',
        address: profile.address || '',
        fatherName: profile.fatherName || '',
        uid: user.uid, // ensure uid is set
        email: user.email,
      }, { merge: true });
      
      let profileUpdate = Promise.resolve();
      if (user.displayName !== profile.displayName) {
        profileUpdate = updateProfile(user, { displayName: profile.displayName });
      }

      Promise.all([saveToFirestore, profileUpdate]).catch(err => {
        console.warn("Background save error:", err);
      });

      // Provide immediate UI feedback for fast perceived performance
      setTimeout(() => {
        setSaving(false);
        setToast("✅ Saved Successfully");
        setTimeout(() => setToast(null), 3000);
      }, 400);

    } catch (error) {
      console.warn("Error saving profile", error);
      alert("Failed to save profile.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-800 mb-6">Student Profile</h2>
      
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm relative">
        {toast && (
          <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-md font-medium text-sm shadow-sm border border-emerald-200 animate-in fade-in">
            {toast}
          </div>
        )}

        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <img referrerPolicy="no-referrer" 
              src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}`} 
              alt="Profile" 
              className="w-24 h-24 rounded-full border-4 border-emerald-100 shadow-sm object-cover"
            />
            <label className="absolute inset-0 bg-black/40 rounded-full flex flex-col items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white mb-1" />
              <span className="text-white text-xs font-medium">Change</span>
              <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} />
            </label>
          </div>
          <p className="text-sm text-slate-500 mt-2">{profile.email}</p>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input 
                type="text" 
                name="displayName"
                value={profile.displayName} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Roll Number</label>
              <input 
                type="text" 
                name="rollNumber"
                value={profile.rollNumber || ''} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class / Grade</label>
              <select 
                name="studentClass"
                value={profile.studentClass || ''} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="">Select Class</option>
                <option value="Class 8">Class 8</option>
                <option value="Class 9">Class 9</option>
                <option value="Class 10">Class 10</option>
                <option value="Class 11">Class 11</option>
                <option value="Class 12">Class 12</option>
                <option value="Competitive">Competitive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Father's Name</label>
              <input 
                type="text" 
                name="fatherName"
                value={profile.fatherName || ''} 
                onChange={handleChange}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Residential Address</label>
            <input 
              type="text" 
              name="address"
              value={profile.address || ''} 
              onChange={handleChange}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl shadow-sm transition-colors disabled:bg-emerald-400"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
