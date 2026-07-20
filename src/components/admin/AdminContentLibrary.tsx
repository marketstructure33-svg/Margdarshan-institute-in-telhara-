import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { StudyMaterial, Notice } from '../../types';
import { FileText, FileType, Bell, Trash2, Loader2, Search, Youtube } from 'lucide-react';

export default function AdminContentLibrary() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'PDF' | 'Note' | 'Notice' | 'Video'>('all');
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    const unsubMaterials = onSnapshot(collection(db, 'StudyMaterials'), (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StudyMaterial));
      results.sort((a, b) => b.uploadDate - a.uploadDate);
      setMaterials(results);
    });

    const unsubNotices = onSnapshot(collection(db, 'Notices'), (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      results.sort((a, b) => b.timestamp - a.timestamp);
      setNotices(results);
      setLoading(false);
    });

    return () => {
      unsubMaterials();
      unsubNotices();
    };
  }, []);

  const handleDeleteMaterial = async (id: string, fileUrl?: string) => {
    try {
      await deleteDoc(doc(db, 'StudyMaterials', id));
      if (fileUrl) {
        // Attempt to delete from storage if it's a firebase storage URL
        try {
          const storageRef = ref(storage, fileUrl);
          await deleteObject(storageRef);
        } catch (e) {
          console.warn("Could not delete from storage (might not exist or different provider):", e);
        }
      }
    } catch (error) {
      console.warn("Error deleting material:", error);
      alert("Failed to delete material.");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'Notices', id));
    } catch (error) {
      console.warn("Error deleting notice:", error);
      alert("Failed to delete notice.");
    }
  };

  const allContent = [
    ...materials.map(m => ({ ...m, date: m.uploadDate, isNotice: false })),
    ...notices.map(n => ({ ...n, date: n.timestamp, isNotice: true, type: 'Notice' }))
  ].sort((a, b) => b.date - a.date);

  const filteredContent = allContent.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      return item.title?.toLowerCase().includes(lowerQuery) || (item.content && item.content.toLowerCase().includes(lowerQuery));
    }
    return true;
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Content Library & History</h2>
          <p className="text-sm text-slate-500">Manage all your published materials and announcements</p>
        </div>
        
        <div className="flex items-center gap-3">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value as any)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none"
          >
            <option value="all">All Types</option>
            <option value="PDF">P.D.Fs Only</option>
            <option value="Note">Notes Only</option>
            <option value="Video">Videos Only</option>
            <option value="Notice">Notices Only</option>
          </select>
          
          <div className="relative w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search library..."
              className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        {loading ? (
          <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-red-600" /></div>
        ) : filteredContent.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-slate-500">
            <p className="text-lg font-medium">No content found</p>
            <p className="text-sm">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="px-6 py-4 font-bold">Type</th>
                <th className="px-6 py-4 font-bold">Title</th>
                <th className="px-6 py-4 font-bold">Details</th>
                <th className="px-6 py-4 font-bold">Published On</th>
                <th className="px-6 py-4 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredContent.map((item: any) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                      item.type === 'PDF' ? 'bg-red-50 text-red-700 border border-red-200' :
                      (item.type === 'Note' || item.type === 'CreatePDF') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      item.type === 'Video' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }`}>
                      {item.type === 'PDF' && <FileText className="w-3.5 h-3.5" />}
                      {(item.type === 'Note' || item.type === 'CreatePDF') && <FileType className="w-3.5 h-3.5" />}
                      {item.type === 'Video' && <Youtube className="w-3.5 h-3.5" />}
                      {item.type === 'Notice' && <Bell className="w-3.5 h-3.5" />}
                      {item.type === 'CreatePDF' ? 'PDF (Generated)' : item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-800 max-w-[200px] truncate" title={item.title}>
                      {item.title}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {item.isNotice ? (
                      <div className="text-slate-500 text-xs max-w-[200px] truncate" title={item.content}>{item.content || '-'}</div>
                    ) : (
                      <div>
                        <div className="font-medium text-slate-700">{item.class} • {item.subject}</div>
                        {item.type === 'PDF' && item.fileSize && (
                          <div className="text-slate-500 text-xs">Size: {item.fileSize}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(item.date).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setItemToDelete({ id: item.id, type: item.isNotice ? 'Notice' : 'Material', fileUrl: item.fileUrl })}
                      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Content"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {itemToDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Confirm Delete</h3>
            <p className="text-slate-600 mb-6">Are you sure you want to delete this {(itemToDelete as any).type}? This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  if ((itemToDelete as any).type === 'Notice') {
                    handleDeleteNotice((itemToDelete as any).id);
                  } else {
                    handleDeleteMaterial((itemToDelete as any).id, (itemToDelete as any).fileUrl);
                  }
                  setItemToDelete(null);
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
