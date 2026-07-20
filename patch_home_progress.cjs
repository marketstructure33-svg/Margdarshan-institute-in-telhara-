const fs = require('fs');
let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

// Add imports
code = code.replace(
  /import \{ doc, getDoc, onSnapshot, updateDoc \} from 'firebase\/firestore';/,
  "import { doc, getDoc, onSnapshot, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';"
);
code = code.replace(
  /import \{ Book, GraduationCap, ChevronRight, Clock, FileText, Download, Eye \} from 'lucide-react';/,
  "import { Book, GraduationCap, ChevronRight, Clock, FileText, Download, Eye, Target } from 'lucide-react';"
);

// Add state for progress
code = code.replace(
  /const \[recentViews, setRecentViews\] = useState<RecentView\[\]>\(\[\]\);/,
  `const [recentViews, setRecentViews] = useState<RecentView[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });`
);

// Add useEffect to fetch progress
const progressEffect = `
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const q = query(
          collection(db, 'StudyMaterials'),
          where('class', '==', selectedClass),
          where('subject', '==', selectedSubject)
        );
        const snapshot = await getDocs(q);
        const totalMaterials = snapshot.docs.map(doc => doc.id);
        
        const userRef = doc(db, 'Users', user.uid);
        const userSnap = await getDoc(userRef);
        let completedIds = [];
        if (userSnap.exists() && userSnap.data().completedMaterials) {
          completedIds = userSnap.data().completedMaterials;
        }
        
        const completedCount = totalMaterials.filter(id => completedIds.includes(id)).length;
        setProgress({ completed: completedCount, total: totalMaterials.length });
      } catch (e) {
        console.error(e);
      }
    };
    
    fetchProgress();
  }, [selectedClass, selectedSubject, user]);
`;

code = code.replace(
  /useEffect\(\(\) => \{\s*const unsub = onSnapshot\(doc\(db, 'Users'/,
  progressEffect + "\n\n  useEffect(() => {\n    const unsub = onSnapshot(doc(db, 'Users'"
);

// UI for Progress
const progressUI = `
      {/* Learning Progress */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2 text-slate-800">
            <Target className="w-6 h-6 text-indigo-600" />
            <h2 className="text-xl font-bold">Learning Progress</h2>
          </div>
          <p className="text-sm text-slate-500">
            {selectedSubject} • {selectedClass}
          </p>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-800">{progress.completed}</span>
            <span className="text-lg font-bold text-slate-400">/ {progress.total}</span>
            <span className="text-sm text-slate-500 ml-2">completed</span>
          </div>
        </div>
        
        <div className="relative w-24 h-24">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <circle
              className="text-slate-100 stroke-current"
              strokeWidth="8"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
            ></circle>
            <circle
              className="text-indigo-600 stroke-current transition-all duration-1000 ease-in-out"
              strokeWidth="8"
              strokeLinecap="round"
              cx="50"
              cy="50"
              r="40"
              fill="transparent"
              strokeDasharray={\`\${2 * Math.PI * 40}\`}
              strokeDashoffset={\`\${2 * Math.PI * 40 - (progress.total > 0 ? (progress.completed / progress.total) * (2 * Math.PI * 40) : 0)}\`}
              transform="rotate(-90 50 50)"
            ></circle>
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold text-indigo-700">
              {progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0}%
            </span>
          </div>
        </div>
      </div>
`;

code = code.replace(
  /\{\/\* Quick Actions \*\/\}/,
  progressUI + "\n\n      {/* Quick Actions */}"
);

fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
