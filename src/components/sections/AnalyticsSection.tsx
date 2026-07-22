import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { Brain, TrendingUp, AlertTriangle, Lightbulb, Loader2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const mockPerformanceData = [
  { name: 'Week 1', math: 65, science: 70, english: 75 },
  { name: 'Week 2', math: 68, science: 74, english: 78 },
  { name: 'Week 3', math: 75, science: 72, english: 80 },
  { name: 'Week 4', math: 82, science: 79, english: 85 },
  { name: 'Week 5', math: 85, science: 84, english: 88 },
];

export function AnalyticsSection() {
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
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

  const generateInsights = async () => {
    
    setLoading(true);
    try {
      const prompt = `Act as an AI educational analyst. Analyze this student performance data: ${JSON.stringify(mockPerformanceData)}.
      Provide:
      1. Predictive insights: What score are they likely to get next week?
      2. Weak areas needing attention.
      3. Actionable study recommendations for parents and students.
      Format in clean Markdown.`;

      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: mockPerformanceData,
          apiKey
        })
      });

      if (!response.ok) {
        throw new Error("Failed to generate insights");
      }

      const data = await response.json();
      const replyText = data.text || "";
      setInsights(replyText);
    } catch (error: any) {
      console.error(error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (apiKey) {
      generateInsights();
    }
  }, [apiKey]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
          <TrendingUp className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Predictive Performance Analytics</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Performance Trends</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockPerformanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#64748b" />
                <YAxis stroke="#64748b" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#f8fafc' }}
                />
                <Legend />
                <Line type="monotone" dataKey="math" stroke="#6366f1" strokeWidth={3} />
                <Line type="monotone" dataKey="science" stroke="#10b981" strokeWidth={3} />
                <Line type="monotone" dataKey="english" stroke="#f59e0b" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
              <Brain className="w-5 h-5 text-indigo-500" />
              AI Predictive Insights
            </h3>
            <button 
              onClick={generateInsights}
              disabled={loading}
              className="text-sm px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-medium hover:bg-indigo-100 dark:hover:bg-indigo-800/40 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
            </button>
          </div>
          
          <div className="prose prose-slate dark:prose-invert max-w-none text-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-500" />
                <p>Analyzing performance patterns...</p>
              </div>
            ) : insights ? (
              <div dangerouslySetInnerHTML={{ __html: insights.replace(/\n/g, '<br/>') }} />
            ) : (
              <p className="text-slate-500">Insights will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
