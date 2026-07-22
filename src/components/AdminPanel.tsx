import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile } from '../types';
import { Users, FileText, FileType, MessageSquare, Trash2, Loader2, Sparkles, Plus, Mic, Send, Square, Bell, BarChart2, X } from 'lucide-react';
import AdminPdfNotesMaker from './admin/AdminPdfNotesMaker';
import AdminAILab from './admin/AdminAILab';
import { AdminWhiteboard } from './admin/AdminWhiteboard';
import AdminInbox from './admin/AdminInbox';
import AdminContentLibrary from './admin/AdminContentLibrary';
import AdminSettings from './admin/AdminSettings';
import AdminScheduleMaker from './admin/AdminScheduleMaker';
import { BookOpen, Presentation } from 'lucide-react';

export default function AdminPanel() {
  const [stats, setStats] = useState({ students: 0, pdfs: 0, notes: 0, chats: 0, notices: 0 });
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [viewingStudent, setViewingStudent] = useState<UserProfile | null>(null);

  useEffect(() => {
    setLoading(true);

    // Users real-time listener
    const unsubUsers = onSnapshot(collection(db, 'Users'), (snapshot) => {
      setStats(prev => ({ ...prev, students: snapshot.size }));
      const studentsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile & { id: string }));
      setStudents(studentsList.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    }, (error) => {
      console.warn("Error fetching users:", error);
      setLoading(false);
    });

    // StudyMaterials real-time listener
    const unsubStudy = onSnapshot(collection(db, 'StudyMaterials'), (snapshot) => {
      let pdfCount = 0;
      let noteCount = 0;
      snapshot.forEach(doc => {
        if (doc.data().type === 'PDF') pdfCount++;
        if (doc.data().type === 'Note') noteCount++;
      });
      setStats(prev => ({ ...prev, pdfs: pdfCount, notes: noteCount }));
    });

    // Chats count real-time listener
    const unsubChats = onSnapshot(collection(db, 'DirectChats'), (snapshot) => {
      const uniqueConversations = new Set();
      snapshot.forEach(doc => {
        uniqueConversations.add(doc.data().conversationId);
      });
      setStats(prev => ({ ...prev, chats: uniqueConversations.size }));
    });

    // Notices count real-time listener
    const unsubNotices = onSnapshot(collection(db, 'Notices'), (snapshot) => {
      setStats(prev => ({ ...prev, notices: snapshot.size }));
    });

    return () => {
      unsubUsers();
      unsubStudy();
      unsubChats();
      unsubNotices();
    };
  }, []);

  const handleDeleteUser = async (uid: string) => {
    
    try {
      await deleteDoc(doc(db, 'Users', uid));
      setStudents(prev => prev.filter(s => s.uid !== uid));
    } catch (error) {
      console.warn("Error deleting user:", error);
      alert("Failed to delete user.");
    }
  };

  return (
    <div className="w-full text-slate-800">
      {/* Admin Navigation */}
      <div className="flex overflow-x-auto gap-2 mb-8 pb-2 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors ${activeTab === 'dashboard' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          Overview & Database
        </button>
        <button 
          onClick={() => setActiveTab('ai_lab')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'ai_lab' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          <Sparkles className="w-4 h-4" /> AI Research Lab
        </button>
        <button 
          onClick={() => setActiveTab('publisher')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'publisher' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          <Plus className="w-4 h-4" /> Create PDF, Notes & Notices
        </button>
        
        <button 
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'schedule' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          <Bell className="w-4 h-4" /> Schedule Events
        </button>


        <button 
          onClick={() => setActiveTab('whiteboard')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'whiteboard' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          <Presentation className="w-4 h-4" /> Live Whiteboard
        </button>
<button 
          onClick={() => setActiveTab('library')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 ${activeTab === 'library' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          <BookOpen className="w-4 h-4" /> Content Library
        </button>
        <button 
          onClick={() => setActiveTab('inbox')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors ${activeTab === 'inbox' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          Student Inbox
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors ${activeTab === 'settings' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
        >
          App Settings
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-2xl border-l-4 border-l-red-500 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <Users className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-sm">Total Students</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">{loading ? '-' : stats.students}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border-l-4 border-l-emerald-500 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <FileText className="w-5 h-5 text-emerald-500" />
                <h3 className="font-medium text-sm">Total P.D.Fs</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">{loading ? '-' : stats.pdfs}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border-l-4 border-l-blue-500 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <FileType className="w-5 h-5 text-blue-500" />
                <h3 className="font-medium text-sm">Published Notes</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">{loading ? '-' : stats.notes}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border-l-4 border-l-purple-500 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <Bell className="w-5 h-5 text-purple-500" />
                <h3 className="font-medium text-sm">Information</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">{loading ? '-' : stats.notices}</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border-l-4 border-l-amber-500 shadow-sm">
              <div className="flex items-center gap-3 text-slate-500 mb-2">
                <MessageSquare className="w-5 h-5 text-amber-500" />
                <h3 className="font-medium text-sm">Active Chats</h3>
              </div>
              <p className="text-3xl font-bold text-slate-800">{loading ? '-' : stats.chats}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-200 bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Student Database</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
              ) : (
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-slate-100 text-slate-600">
                    <tr>
                      <th className="px-6 py-4 font-bold">Avatar</th>
                      <th className="px-6 py-4 font-bold">Name</th>
                      <th className="px-6 py-4 font-bold">Class & Roll No</th>
                      <th className="px-6 py-4 font-bold">Father's Name</th>
                      <th className="px-6 py-4 font-bold">Address</th>
                      <th className="px-6 py-4 font-bold">Joined</th>
                      <th className="px-6 py-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map((student) => (
                      <tr key={student.uid} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <img referrerPolicy="no-referrer" src={student.photoURL || `https://ui-avatars.com/api/?name=${student.displayName}`} alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{student.displayName}</div>
                          <div className="text-slate-500 text-xs">{student.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium">{student.studentClass || '-'}</div>
                          <div className="text-slate-500 text-xs">Roll: {student.rollNumber || '-'}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">{student.fatherName || '-'}</td>
                        <td className="px-6 py-4 text-slate-600 truncate max-w-[150px]" title={student.address}>{student.address || '-'}</td>
                        <td className="px-6 py-4 text-slate-500">{new Date(student.createdAt).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => setViewingStudent(student)}
                              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                              title="View Progress"
                            >
                              <BarChart2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleDeleteUser(student.uid)}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete User"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ai_lab' && <AdminAILab onBack={() => setActiveTab('dashboard')} />}
      {activeTab === 'publisher' && <AdminPdfNotesMaker />}
      {activeTab === 'schedule' && <AdminScheduleMaker />}
      {activeTab === 'library' && <AdminContentLibrary />}
      {activeTab === 'inbox' && <AdminInbox students={students} />}
      {activeTab === 'settings' && <AdminSettings />}
      {activeTab === 'whiteboard' && <AdminWhiteboard />}

      {viewingStudent && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div className="flex items-center gap-4">
                <img src={viewingStudent.photoURL || `https://ui-avatars.com/api/?name=${viewingStudent.displayName}`} className="w-12 h-12 rounded-full" />
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

      {userToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Confirm Delete User</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this user? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  handleDeleteUser(userToDelete);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 font-medium bg-red-600 text-white hover:bg-red-700 rounded-xl transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

}
