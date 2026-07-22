import { useState } from 'react';

import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useEffect } from 'react';

import { Loader2, Sparkles, Calendar, BookOpen } from 'lucide-react';
import Markdown from 'react-markdown';

interface AIStudyPlannerSectionProps {
  selectedClass: string;
  selectedSubject: string;
}

export default function AIStudyPlannerSection({ selectedClass, selectedSubject }: AIStudyPlannerSectionProps) {
  const [schedule, setSchedule] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      const keysRef = doc(db, 'Settings', 'apiKeys');
      const keysSnap = await getDoc(keysRef);
      if (keysSnap.exists()) {
        setApiKey(keysSnap.data().userPlannerApiKey || null);
      }
    };
    fetchApiKey();
  }, []);


  const generateSchedule = async () => {
    setLoading(true);
    setError(null);
    try {
      
      
      const prompt = `Generate a personalized, structured 7-day study schedule for a student in ${selectedClass} studying ${selectedSubject}. 
       Include specific topics to cover each day, practical exercises, and review sessions. 
       Format the response in clean Markdown with clear headings and bullet points.`;

      
      const response = await fetch('/api/study-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedClass,
          selectedSubject,
          apiKey
        })
      });
    

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to generate study schedule");
      }

      const data = await response.json();
      const replyText = data.schedule;
      setSchedule(replyText);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-emerald-500" />
          AI Study Planner
        </h2>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
          {selectedClass} • {selectedSubject}
        </div>
      </div>

      {!schedule && !loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Generate Your Custom Study Plan</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md mx-auto">
            Get a personalized 7-day study schedule crafted by AI specifically for your class and subject.
          </p>
          <button
            onClick={generateSchedule}
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-xl shadow-md transition-colors"
          >
            <Sparkles className="w-5 h-5" />
            Generate Plan Now
          </button>
        </div>
      )}

      {loading && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium animate-pulse">
            Analyzing curriculum and generating your personalized schedule...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl text-center border border-red-200 dark:border-red-800">
          {error}
        </div>
      )}

      {schedule && !loading && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm prose prose-slate dark:prose-invert max-w-none">
            <div className="markdown-body">
              <Markdown>{schedule}</Markdown>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              onClick={generateSchedule}
              className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 font-medium transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Regenerate Plan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
