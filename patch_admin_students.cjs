const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /import \{ Users, FileText, FileType, MessageSquare, Trash2, Loader2, Sparkles, Plus, Mic, Send, Square, Bell \} from 'lucide-react';/,
  "import { Users, FileText, FileType, MessageSquare, Trash2, Loader2, Sparkles, Plus, Mic, Send, Square, Bell, BarChart2 } from 'lucide-react';"
);

// We need to add an AnalyticsModal
// First add state
code = code.replace(
  /const \[userToDelete, setUserToDelete\] = useState<string \| null>\(null\);/,
  "const [userToDelete, setUserToDelete] = useState<string | null>(null);\n  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(null);"
);

// Replace the Actions td
code = code.replace(
  /<td className="px-6 py-4 text-right">\s*<button\s*onClick=\{([^}]*?handleDeleteUser[^}]*?)\}\s*className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"\s*title="Delete User"\s*>\s*<Trash2 className="w-5 h-5" \/>\s*<\/button>\s*<\/td>/g,
  `<td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setViewingStudent(student)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Progress"
                            >
                              <BarChart2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={$1}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>`
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
