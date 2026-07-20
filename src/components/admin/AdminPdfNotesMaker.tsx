import { useState } from 'react';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { FileText, FileType, Upload, Loader2, CheckCircle2, Bell, FilePlus, Link, Youtube } from 'lucide-react';


const CLASSES = ['Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12', 'Competitive'];
const SUBJECTS = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Sanskrit', 'General', 'Hindi', 'English'];

const withTimeout = <T,>(promise: Promise<T>, ms: number, errorMessage: string): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(errorMessage)), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

export default function AdminPdfNotesMaker() {
  const [type, setType] = useState<'PDF' | 'CreatePDF' | 'Note' | 'Notice' | 'Video'>('PDF');
  const [targetClass, setTargetClass] = useState('Class 10');
  const [subject, setSubject] = useState('Mathematics');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pdfLink, setPdfLink] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((type === 'PDF' || type === 'Video') && !pdfLink) {
      alert("Please enter a valid link.");
      return;
    }
    if ((type === 'CreatePDF' || type === 'Note' || type === 'Notice') && !content) {
      alert("Please enter the content.");
      return;
    }

    setLoading(true);
    setSuccess('');

    try {
      if (type === 'Notice') {
        await withTimeout(
          addDoc(collection(db, 'Notices'), {
            title,
            content,
            timestamp: Date.now()
          }),
          10000,
          "Notice creation timed out. Please check your database connection and rules."
        );
      } else {
        await withTimeout(
          addDoc(collection(db, 'StudyMaterials'), {
            type,
            class: targetClass,
            subject,
            title,
            content: (type === 'Note' || type === 'CreatePDF' || type === 'Video') ? content : '',
            fileUrl: (type === 'PDF' || type === 'Video') ? pdfLink : '',
            fileSize: (type === 'PDF' || type === 'Video') ? 'Link' : '',
            uploadDate: Date.now()
          }),
          10000,
          "Database update timed out. Please check your database connection and rules."
        );
      }

      if (sendEmail) {
        try {
          const usersSnapshot = await withTimeout(
            getDocs(collection(db, 'Users')),
            10000,
            "Failed to fetch users for notifications."
          );
          const emails: string[] = [];
          usersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.email) emails.push(data.email);
          });

          if (emails.length > 0) {
            // Fire and forget fetch to avoid blocking the UI
            fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                emails,
                title,
                type: type === 'CreatePDF' ? 'PDF' : type,
                content: (type === 'Notice' || type === 'Note') ? content : '',
                class: targetClass,
                subject
              })
            }).catch(emailError => console.error("Failed to send email notifications:", emailError));
          }
        } catch (emailError) {
          console.error("Failed to fetch users for email notifications:", emailError);
        }
      }

      setSuccess(`✅ ${type === 'Notice' ? 'Notice' : 'Material'} published successfully!`);
      setTitle('');
      setContent('');
      setPdfLink('');
    } catch (error: any) {
      console.warn("Error publishing material:", error);
      alert(error.message || "Failed to publish material.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="bg-slate-900 p-6 text-white border-b-4 border-red-500">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Upload className="w-6 h-6 text-red-400" />
          Content Management System
        </h2>
        <p className="text-slate-400 mt-1">Publish P.D.Fs, Study Notes, or Notices directly to student panels.</p>
      </div>

      <div className="p-8">
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Material Type */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Content Type</label>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${type === 'PDF' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="type" value="PDF" checked={type === 'PDF'} onChange={() => setType('PDF')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                <Link className={`w-5 h-5 ${type === 'PDF' ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="font-bold">P.D.F Link</span>
              </label>
              
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${type === 'CreatePDF' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="type" value="CreatePDF" checked={type === 'CreatePDF'} onChange={() => setType('CreatePDF')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                <FilePlus className={`w-5 h-5 ${type === 'CreatePDF' ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="font-bold">Create P.D.F</span>
              </label>

              <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${type === 'Note' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="type" value="Note" checked={type === 'Note'} onChange={() => setType('Note')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                <FileType className={`w-5 h-5 ${type === 'Note' ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="font-bold">Study Note</span>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${type === 'Notice' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="type" value="Notice" checked={type === 'Notice'} onChange={() => setType('Notice')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                <Bell className={`w-5 h-5 ${type === 'Notice' ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="font-bold">Notice / Alert</span>
              </label>
              <label className={`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${type === 'Video' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'}`}>
                <input type="radio" name="type" value="Video" checked={type === 'Video'} onChange={() => setType('Video')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                <Youtube className={`w-5 h-5 ${type === 'Video' ? 'text-red-500' : 'text-slate-400'}`} />
                <span className="font-bold">Video</span>
              </label>

            </div>
          </div>
          {type !== 'Notice' && (
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Class</label>
                <select value={targetClass} onChange={(e) => setTargetClass(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                  {CLASSES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Target Subject</label>
                <select value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-medium">
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{type === 'Notice' ? 'Notice Title' : 'Document Title / Chapter Name'}</label>
            <input 
              type="text" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-medium"
              required 
              placeholder={type === 'Notice' ? "e.g. Holiday on Monday" : "e.g. Trigonometry Formulas Part 1"}
            />
          </div>
          {(type === 'Note' || type === 'Notice' || type === 'CreatePDF' || type === 'Video') && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {type === 'Notice' ? 'Notice Details' : type === 'CreatePDF' ? 'P.D.F Content (Text)' : type === 'Video' ? 'Video Description / Notes' : 'Note Content / Institutional Rules'}
              </label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-sans resize-none"
                required={type === 'Note' || type === 'Notice' || type === 'CreatePDF'}
                placeholder={type === 'Notice' ? "Type announcement details..." : type === 'CreatePDF' ? "Type content to generate P.D.F..." : type === 'Video' ? "Type video description or summary..." : "Type your notes here..."}
              />
            </div>
          )}
          {(type === 'PDF' || type === 'Video') && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">{type === 'Video' ? 'YouTube Video Link' : 'PDF Link (Google Drive, etc.)'}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="url" 
                  value={pdfLink} 
                  onChange={(e) => setPdfLink(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-medium"
                  required 
                  placeholder={type === 'Video' ? "https://youtube.com/watch?v=..." : "https://drive.google.com/file/d/..."}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {type === 'Video' ? 'Paste the full YouTube URL (e.g. https://www.youtube.com/watch?v=...).' : 'Paste the sharing link of your PDF file hosted on Google Drive or any other cloud storage.'}
              </p>
            </div>
          )}

          <div className="flex items-center gap-3 py-2">
            <input 
              type="checkbox" 
              id="send-email" 
              checked={sendEmail} 
              onChange={(e) => setSendEmail(e.target.checked)} 
              className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
            />
            <label htmlFor="send-email" className="text-sm font-bold text-slate-700 cursor-pointer">
              Notify students via email
            </label>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-4 rounded-xl shadow-md transition-colors disabled:bg-red-400 text-lg tracking-wide"
            >
              {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : '🚀'}
              {loading ? 'Publishing...' : 'Publish to Student Panel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
