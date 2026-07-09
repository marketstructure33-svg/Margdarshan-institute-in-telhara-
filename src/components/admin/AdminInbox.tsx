import { useState, useRef, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, getDocs, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { ChatMessage, UserProfile } from '../../types';
import { Send, Paperclip, Loader2, User, Mic, Square, Shield } from 'lucide-react';

export default function AdminInbox({ students }: { students: UserProfile[] }) {
  const [conversations, setConversations] = useState<{uid: string, name: string, photo: string, lastMessage: number}[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Fetch unique conversations
  useEffect(() => {
    const q = query(collection(db, 'DirectChats'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = new Map();
      const usersMap = new Map();
      students.forEach(s => usersMap.set(s.uid, s));
      
      // Sort by timestamp descending in memory
      const docs = snapshot.docs.map(doc => doc.data() as ChatMessage);
      docs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      
      docs.forEach(data => {
        if (!data.conversationId) return;
        if (!convos.has(data.conversationId)) {
          const user = usersMap.get(data.conversationId);
          convos.set(data.conversationId, {
            uid: data.conversationId,
            name: user?.displayName || 'Unknown Student',
            photo: user?.photoURL || '',
            lastMessage: data.timestamp
          });
        }
      });
      setConversations(Array.from(convos.values()));
    }, (error) => {
      console.warn("Error fetching direct chats:", error);
    });
    
    return () => unsubscribe();
  }, [students]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!selectedUser) return;
    const q = query(
      collection(db, 'DirectChats'),
      where('conversationId', '==', selectedUser)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      results.sort((a, b) => (a.timestamp || 0) - (b.timestamp || 0));
      setMessages(results);
    });
    return () => unsubscribe();
  }, [selectedUser]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedUser) return;

    const messageText = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      await addDoc(collection(db, 'DirectChats'), {
        conversationId: selectedUser,
        senderId: 'admin',
        receiverId: selectedUser,
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
    if (!file || !selectedUser) return;

    setIsLoading(true);
    try {
      const storageRef = ref(storage, `ChatFiles/admin/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);

      const isImage = file.type.startsWith('image/');

      await addDoc(collection(db, 'DirectChats'), {
        conversationId: selectedUser,
        senderId: 'admin',
        receiverId: selectedUser,
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.warn("Error accessing microphone:", err);
      alert("Could not access microphone for voice recording.");
    }
  };

  const stopAndSendRecording = async () => {
    if (!mediaRecorderRef.current || !selectedUser) return;

    setIsLoading(true);
    mediaRecorderRef.current.onstop = async () => {
      setIsRecording(false);
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      try {
        const storageRef = ref(storage, `VoiceNotes/admin_${Date.now()}.webm`);
        await uploadBytes(storageRef, audioBlob);
        const url = await getDownloadURL(storageRef);

        await addDoc(collection(db, 'DirectChats'), {
          conversationId: selectedUser,
          senderId: 'admin',
          receiverId: selectedUser,
          text: 'Voice Note',
          fileUrl: url,
          messageType: 'voice',
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn("Error uploading voice note:", error);
      } finally {
        setIsLoading(false);
        // Stop all tracks
        mediaRecorderRef.current?.stream.getTracks().forEach(track => track.stop());
      }
    };
    
    mediaRecorderRef.current.stop();
  };

  const selectedUserInfo = conversations.find(c => c.uid === selectedUser);

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[calc(100vh-14rem)] min-h-[600px]">
      
      {/* Left Sidebar - Inbox List */}
      <div className="w-full md:w-1/3 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 bg-slate-100 border-b border-slate-200 font-bold text-slate-800">
          Student Inbox
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="text-slate-500 text-center py-8 text-sm">No conversations yet.</p>
          ) : (
            conversations.map(conv => (
              <button
                key={conv.uid}
                onClick={() => setSelectedUser(conv.uid)}
                className={`w-full flex items-center gap-3 p-4 border-b border-slate-100 transition-colors text-left ${selectedUser === conv.uid ? 'bg-red-50 border-l-4 border-l-red-500' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}`}
              >
                <img referrerPolicy="no-referrer" src={conv.photo || `https://ui-avatars.com/api/?name=${conv.name}`} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
                <div className="flex-1 overflow-hidden">
                  <h3 className="font-bold text-slate-800 truncate text-sm">{conv.name}</h3>
                  <p className="text-xs text-slate-400 truncate">Tap to view messages</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Chat Area */}
      <div className="w-full md:w-2/3 flex flex-col bg-white relative">
        {!selectedUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <MessageIcon className="w-16 h-16 mb-4 text-slate-300" />
            <p className="font-medium text-lg text-slate-500">Select a student to start chatting</p>
          </div>
        ) : (
          <>
            <div className="p-4 bg-white border-b border-slate-200 flex items-center gap-3 shadow-sm z-10">
              <img referrerPolicy="no-referrer" src={selectedUserInfo?.photo || `https://ui-avatars.com/api/?name=${selectedUserInfo?.name}`} alt="" className="w-10 h-10 rounded-full object-cover shadow-sm" />
              <div>
                <h2 className="font-bold text-slate-800">{selectedUserInfo?.name}</h2>
                <p className="text-xs text-slate-500 font-medium">Student • Margdarshan Institute</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {messages.map((msg) => {
                const isAdmin = msg.senderId === 'admin';
                return (
                  <div key={msg.id} className={`flex gap-3 ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                    {!isAdmin && (
                      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-slate-600" />
                      </div>
                    )}
                    
                    <div className={`max-w-[75%] rounded-2xl p-4 shadow-sm ${
                      isAdmin 
                        ? 'bg-red-600 text-white rounded-br-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}>
                      {msg.messageType === 'text' && (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                      )}
                      {msg.messageType === 'image' && msg.fileUrl && (
                        <img referrerPolicy="no-referrer" src={msg.fileUrl} alt="Upload" className="max-w-full rounded-lg max-h-64 object-cover" />
                      )}
                      {msg.messageType === 'file' && msg.fileUrl && (
                        <a href={msg.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline underline-offset-2 font-medium">
                          <Paperclip className="w-4 h-4" /> {msg.text}
                        </a>
                      )}
                      {msg.messageType === 'voice' && msg.fileUrl && (
                        <audio controls src={msg.fileUrl} className="max-w-full h-10 mt-1" />
                      )}
                      <p className={`text-[10px] mt-2 text-right ${isAdmin ? 'text-red-200' : 'text-slate-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </p>
                    </div>

                    {isAdmin && (
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center shrink-0 shadow-sm border border-red-200">
                        <Shield className="w-4 h-4 text-red-600" />
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && (
                <div className="flex justify-end">
                  <Loader2 className="w-5 h-5 animate-spin text-red-600" />
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  disabled={isLoading || isRecording}
                >
                  <Paperclip className="w-6 h-6" />
                </button>
                
                {isRecording ? (
                  <button
                    type="button"
                    onClick={stopAndSendRecording}
                    className="p-3 flex items-center gap-2 bg-red-100 text-red-600 rounded-xl font-bold animate-pulse"
                  >
                    <Square className="w-6 h-6 fill-red-600" />
                    Recording...
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={startRecording}
                    className="p-3 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                    disabled={isLoading}
                    title="Record Voice Note"
                  >
                    <Mic className="w-6 h-6" />
                  </button>
                )}

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message to student..."
                  className="flex-1 bg-slate-100 border-none rounded-xl py-3 px-4 focus:ring-2 focus:ring-red-500 focus:bg-white transition-all outline-none"
                  disabled={isLoading || isRecording}
                />
                
                <button
                  type="submit"
                  disabled={isLoading || isRecording || !input.trim()}
                  className="p-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 shadow-sm"
                >
                  <Send className="w-6 h-6" />
                </button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
    </svg>
  );
}
