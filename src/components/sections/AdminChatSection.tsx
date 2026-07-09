import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ChatMessage } from '../../types';
import { Send, Paperclip, Loader2, User as UserIcon, Shield, Mic, Square } from 'lucide-react';

export default function AdminChatSection({ user }: { user: User }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Only fetch messages involving this user
    const q = query(
      collection(db, 'DirectChats'),
      where('conversationId', '==', user.uid) // Using uid as conversationId for simplicity
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      results.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(results);
    });
    
    return () => unsubscribe();
  }, [user.uid]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'DirectChats'), {
        conversationId: user.uid,
        senderId: user.uid,
        receiverId: 'admin',
        text: messageText,
        messageType: 'text',
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const storageRef = ref(storage, `ChatFiles/${user.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const isImage = file.type.startsWith('image/');

      await addDoc(collection(db, 'DirectChats'), {
        conversationId: user.uid,
        senderId: user.uid,
        receiverId: 'admin',
        text: file.name,
        fileUrl: url,
        messageType: isImage ? 'image' : 'file',
        timestamp: Date.now()
      });
    } catch (error) {
      console.warn("Error uploading file:", error);
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-12rem)] min-h-[600px]">
      {/* Header */}
      <div className="bg-[#0f172a] p-4 text-white flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">Abhishek Bhaiya</h2>
            <p className="text-xs text-red-300 font-medium">Admin & Educator</p>
          </div>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        <div className="text-center pb-6 border-b border-slate-200 mb-6">
          <p className="text-sm text-slate-500">This is a direct chat with Abhishek Bhaiya. You can ask for doubt clearance or report issues.</p>
        </div>
        
        {messages.map((msg) => {
          const isMe = msg.senderId === user.uid;
          
          return (
            <div key={msg.id} className={`flex gap-3 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {!isMe && (
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                  <Shield className="w-4 h-4 text-red-600" />
                </div>
              )}
              
              <div className={`max-w-[75%] rounded-2xl p-3 ${
                isMe 
                  ? 'bg-emerald-600 text-white rounded-br-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm shadow-sm'
              }`}>
                {msg.messageType === 'text' && (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                )}
                {msg.messageType === 'image' && msg.fileUrl && (
                  <img referrerPolicy="no-referrer" src={msg.fileUrl} alt="Upload" className="max-w-full rounded-lg max-h-64 object-cover" />
                )}
                {msg.messageType === 'file' && msg.fileUrl && (
                  <a 
                    href={msg.fileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm underline underline-offset-2"
                  >
                    <Paperclip className="w-4 h-4" /> {msg.text}
                  </a>
                )}
                {msg.messageType === 'voice' && msg.fileUrl && (
                  <audio controls src={msg.fileUrl} className="max-w-full h-10 mt-1" />
                )}
                <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-emerald-200' : 'text-slate-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                </p>
              </div>

              {isMe && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <UserIcon className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          );
        })}
        {isLoading && (
          <div className="flex justify-end">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSendMessage} className="flex items-end gap-2">
          <input
            type="file"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors shrink-0"
            disabled={isLoading}
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-100 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
