import { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StudyMaterial } from '../../types';
import { FileText, Loader2, Download, Eye, X, Search, Printer, ExternalLink } from 'lucide-react';
import { recordRecentView } from '../../lib/tracking';
import { jsPDF } from 'jspdf';

export default function PdfSection({ user, selectedClass, selectedSubject }: { user?: User, selectedClass: string, selectedSubject: string }) {
  const [pdfs, setPdfs] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'StudyMaterials'),
      where('type', 'in', ['PDF', 'CreatePDF'])
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
      const results = allDocs.filter(doc => doc.class === selectedClass && doc.subject === selectedSubject);
      results.sort((a, b) => b.uploadDate - a.uploadDate);
      setPdfs(results);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching PDFs:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass, selectedSubject]);

  const filteredPdfs = useMemo(() => {
    if (!searchQuery.trim()) return pdfs;
    const lowerQuery = searchQuery.toLowerCase();
    return pdfs.filter(pdf => 
      pdf.title.toLowerCase().includes(lowerQuery)
    );
  }, [pdfs, searchQuery]);

  const handlePrintPdf = (url: string) => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      try {
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      } catch (e) {
        // Fallback for CORS issues
        window.open(url, '_blank');
        document.body.removeChild(iframe);
      }
    };
  };

  const getPdfUrl = (pdf: StudyMaterial) => {
    if (pdf.type === 'CreatePDF' && pdf.content) {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(pdf.title, 10, 20);
      doc.setFontSize(12);
      
      const splitText = doc.splitTextToSize(pdf.content, 180);
      doc.text(splitText, 10, 35);
      
      return doc.output('datauristring');
    }
    return pdf.fileUrl;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          P.D.F Materials <span className="text-slate-400 text-lg font-medium ml-2">({selectedClass} • {selectedSubject})</span>
        </h2>
        
        <div className="relative w-full sm:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
            placeholder="Search PDFs by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      ) : filteredPdfs.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-12 rounded-2xl border border-slate-200 dark:border-slate-700 text-center">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <p className="text-lg text-slate-600 dark:text-slate-300 font-medium">
            {searchQuery ? "No PDFs found matching your search." : "No PDFs available for this subject yet."}
          </p>
          <p className="text-sm text-slate-400">
            {searchQuery ? "Try a different keyword." : "Check back later or ask Abhishek Bhaiya."}
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPdfs.map((pdf) => (
            <div key={pdf.id} className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2" title={pdf.title}>{pdf.title}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {new Date(pdf.uploadDate).toLocaleDateString()} {pdf.fileSize ? `• ${pdf.fileSize}` : ''}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => {
                    setViewPdfUrl(getPdfUrl(pdf) || null);
                    if (user) recordRecentView(user.uid, pdf);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
                >
                  <Eye className="w-4 h-4" /> View
                </button>
                <button
                  onClick={() => {
                    const url = getPdfUrl(pdf);
                    if (url) handlePrintPdf(url);
                    if (user) recordRecentView(user.uid, pdf);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <a
                  href={getPdfUrl(pdf) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (user) recordRecentView(user.uid, pdf);
                  }}
                  className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors"
                >
                  <Download className="w-4 h-4" /> Save
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Viewer Modal */}
      {viewPdfUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
              <h3 className="font-bold text-slate-800 dark:text-white">Document Viewer</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePrintPdf(viewPdfUrl)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print
                </button>
                <button 
                  onClick={() => setViewPdfUrl(null)}
                  className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-200 dark:bg-slate-700">
              <iframe 
                src={`${viewPdfUrl}#toolbar=0`} 
                className="w-full h-full border-none"
                title="PDF Viewer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
