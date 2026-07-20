import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { StudyMaterial } from '../../types';
import { FileText, Loader2, BrainCircuit } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import ReactMarkdown from 'react-markdown';
import { pdfjs } from 'react-pdf';

import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

interface AIQuizSectionProps {
  selectedClass: string;
  selectedSubject: string;
}


const getProxyUrl = (url: string) => {
  if (url && url.startsWith('http')) {
    return `/api/proxy-pdf?url=${encodeURIComponent(url)}`;
  }
  return url;
};

export function AIQuizSection({ selectedClass, selectedSubject }: AIQuizSectionProps) {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [quizResult, setQuizResult] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const keysRef = doc(db, 'Settings', 'apiKeys');
        const keysSnap = await getDoc(keysRef);
        if (keysSnap.exists()) {
          setApiKey(keysSnap.data().userPlannerApiKey || null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchApiKey();
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = query(
      collection(db, 'StudyMaterials'),
      where('class', '==', selectedClass),
      where('subject', '==', selectedSubject)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
      const pdfDocs = allDocs.filter(d => d.type === 'PDF' || d.type === 'CreatePDF' || d.type === 'Note');
      pdfDocs.sort((a, b) => b.uploadDate - a.uploadDate);
      setMaterials(pdfDocs);
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching materials:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [selectedClass, selectedSubject]);

  const extractPdfText = async (url: string) => {
    const loadingTask = pdfjs.getDocument(getProxyUrl(url));
    const pdf = await loadingTask.promise;
    const maxPages = Math.min(pdf.numPages, 10);
    let fullText = '';
    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  };

  const generateQuiz = async (material: StudyMaterial) => {
    setGeneratingFor(material.id);
    setQuizResult(null);
    try {
      let noteContent = '';
      if (material.content) {
        noteContent = material.content;
      } else if (material.fileUrl) {
        noteContent = await extractPdfText(material.fileUrl);
      } else {
        throw new Error('No content found in this material.');
      }
      
      if (noteContent.length > 15000) {
        noteContent = noteContent.substring(0, 15000) + '...';
      }

      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: material.title,
          noteContent,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }
      
      const data = await response.json();
      setQuizResult(data.quiz);
      
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Failed to generate quiz.');
    } finally {
      setGeneratingFor(null);
    }
  };

  if (quizResult) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-fuchsia-500" />
            AI Generated Quiz
          </h2>
          <button
            onClick={() => setQuizResult(null)}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Back to Materials
          </button>
        </div>
        
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown>{quizResult}</ReactMarkdown>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-fuchsia-100 dark:bg-fuchsia-900/30 text-fuchsia-600 dark:text-fuchsia-400 rounded-lg">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            AI Quiz Generator <span className="text-slate-400 text-lg font-medium ml-2">({selectedClass} • {selectedSubject})</span>
          </h2>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden p-6">
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          Select a study material below to generate a custom multiple-choice quiz using AI.
        </p>

        {loading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-fuchsia-600" />
          </div>
        ) : materials.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
            <FileText className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-slate-600 dark:text-slate-400 font-medium">No study materials found for this subject.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {materials.map(material => (
              <div key={material.id} className="flex flex-col p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors">
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2 rounded-lg shrink-0 ${material.type === 'PDF' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white line-clamp-2">{material.title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{new Date(material.uploadDate).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => generateQuiz(material)}
                    disabled={generatingFor !== null}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingFor === material.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Generating...
                      </>
                    ) : (
                      <>
                        <BrainCircuit className="w-4 h-4" /> Generate AI Quiz
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
