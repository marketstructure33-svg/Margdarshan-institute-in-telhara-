const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

const modalStr = `
      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <img src={viewingStudent.photoURL || \`https://ui-avatars.com/api/?name=\${viewingStudent.displayName}\`} className="w-12 h-12 rounded-full" />
                <div>
                  <h2 className="text-xl font-bold text-slate-800">{viewingStudent.displayName}'s Progress</h2>
                  <p className="text-sm text-slate-500">{viewingStudent.studentClass} • Roll: {viewingStudent.rollNumber || '-'}</p>
                </div>
              </div>
              <button 
                onClick={() => setViewingStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
              <div className="grid md:grid-cols-2 gap-6">
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <BarChart2 className="w-5 h-5 text-indigo-500" />
                    Overall Engagement
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600 font-medium">Joined Date</span>
                      <span className="font-bold">{new Date(viewingStudent.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600 font-medium">Saved Bookmarks</span>
                      <span className="font-bold text-indigo-600">{viewingStudent.bookmarks?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                      <span className="text-slate-600 font-medium">Status</span>
                      <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-md text-xs font-bold">ACTIVE</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-fuchsia-500" />
                    AI Interaction
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    Analytics model computes predictive learning paths based on interaction with AI Tutor and Quizzes.
                  </p>
                  <div className="w-full bg-slate-100 h-24 rounded-lg flex items-center justify-center border border-dashed border-slate-300">
                    <span className="text-slate-400 font-medium">Detailed logs sync pending...</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
`;

code = code.replace(
  /\{userToDelete && \(/,
  modalStr.trim() + "\n\n      {userToDelete && ("
);

// add X icon
code = code.replace(
  /import \{ Users, FileText, FileType, MessageSquare, Trash2, Loader2, Sparkles, Plus, Mic, Send, Square, Bell, BarChart2 \} from 'lucide-react';/,
  "import { Users, FileText, FileType, MessageSquare, Trash2, Loader2, Sparkles, Plus, Mic, Send, Square, Bell, BarChart2, X } from 'lucide-react';"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
