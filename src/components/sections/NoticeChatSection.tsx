import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

import { Notice } from '../../types';
import { Send, Paperclip, Loader2, Bot, User as UserIcon, X, Image as ImageIcon } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64
  imageType?: string;
}

export default function NoticeChatSection({ user }: { user: User }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  
  // Chat state
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Hello! I am the Margdarshan AI Tutor. You can ask me questions about your studies, or attach a photo of a problem and I will explain it.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ url: string, base64: string, type: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      const keysRef = doc(db, 'Settings', 'apiKeys');
      const keysSnap = await getDoc(keysRef);
      if (keysSnap.exists()) {
        setApiKey(keysSnap.data().userChatApiKey || null);
      }
    };
    fetchApiKey();
  }, []);


  useEffect(() => {
    // Fetch notices
    const q = query(collection(db, 'Notices'), orderBy('timestamp', 'desc'), limit(5));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notice));
      setNotices(results);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert("Please upload an image file (PNG/JPG).");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setAttachment({
        url: URL.createObjectURL(file),
        base64: base64String.split(',')[1],
        type: file.type
      });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !attachment) return;

    const userMessageText = input.trim();
    const currentAttachment = attachment;
    
    const newUserMessage: Message = { 
      role: 'user', 
      text: userMessageText,
      image: currentAttachment?.base64,
      imageType: currentAttachment?.type
    };
    
    setMessages(prev => [...prev, { ...newUserMessage, image: currentAttachment?.url }]);
    
    setInput('');
    setAttachment(null);
    setIsLoading(true);

    try {
      const chatMessages = [...messages, newUserMessage].map(m => ({
        role: m.role,
        text: m.text,
        image: m.image,
        imageType: m.imageType
      }));

      if (!apiKey) {
        throw new Error("API Key is missing. Please contact admin to configure it.");
      }
      const ai = new GoogleGenAI({ apiKey });
      
      const formattedMessages = chatMessages.map((m: any) => {
          const parts: any[] = [];
          if (m.text) parts.push({ text: m.text });
          if (m.image) {
              let base64Data = m.image;
              if (base64Data.includes(',')) {
                  base64Data = base64Data.split(',')[1];
              }
              parts.push({
                  inlineData: {
                      data: base64Data,
                      mimeType: m.imageType || 'image/jpeg'
                  }
              });
          }
          return { role: m.role === 'model' ? 'model' : 'user', parts };
      });

      const response = await ai.models.generateContent({
          model: 'gemini-1.5-flash',
          contents: formattedMessages,
          config: {
              systemInstruction: 'You are a helpful AI assistant for the Margdarshan Institute notice board. Answer questions clearly based on the provided context.'
          }
      });
      
      const data = { text: response.text };

      setMessages(prev => [...prev, { 
         role: 'model', 
         text: data.text || "I couldn't generate a response."
      }]);
    } catch (error) {
      console.warn("AI Error:", error);
      setMessages(prev => [...prev, { 
         role: 'model', 
         text: "Sorry, I encountered an error. Please try again."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
      {/* Left Column: Notices */}
      <div className="lg:w-1/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-600 p-4 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">📢 Institutional Notices</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {notices.length === 0 ? (
            <p className="text-slate-500 text-center py-8">No recent notices.</p>
          ) : (
            notices.map(notice => (
              <div key={notice.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="font-bold text-slate-800 mb-1">{notice.title}</h3>
                <p className="text-sm text-slate-600 line-clamp-3 mb-2">{notice.content}</p>
                <p className="text-xs text-slate-400 font-medium">{new Date(notice.timestamp).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Column: AI Chat */}
      <div className="lg:w-2/3 flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-full">
        <div className="bg-[#0f172a] p-4 text-white flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-lg">
            <Bot className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-bold">Margdarshan AI Tutor</h2>
            <p className="text-xs text-slate-400">Powered by Gemini AI</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 text-emerald-600" />
                </div>
              )}
              
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm'
              }`}>
                {msg.image && (
                  <img referrerPolicy="no-referrer" src={msg.image} alt="Upload" className="max-w-full rounded-lg mb-3 max-h-64 object-cover" />
                )}
                <div className="prose prose-sm max-w-none">
                   {msg.text.split('\n').map((line, idx) => <p key={idx} className="m-0 min-h-[1em]">{line}</p>)}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 text-slate-600" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="max-w-3xl mx-auto">
            {attachment && (
              <div className="mb-3 flex items-center gap-2 bg-slate-100 p-2 rounded-lg w-max pr-4 border border-slate-200">
                <div className="w-10 h-10 bg-slate-200 rounded overflow-hidden">
                  <img referrerPolicy="no-referrer" src={attachment.url} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm text-slate-600 font-medium">Image attached</span>
                <button 
                  onClick={() => setAttachment(null)}
                  className="ml-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-slate-50 rounded-2xl p-2 border border-slate-200 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-emerald-600 hover:bg-emerald-100 rounded-xl transition-colors shrink-0"
                title="Attach Photo"
              >
                <Paperclip className="w-6 h-6" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Margdarshan AI Tutor..."
                className="flex-1 bg-transparent border-none py-3 px-2 resize-none max-h-32 min-h-[44px] focus:ring-0 text-slate-900 placeholder-slate-400 outline-none"
                disabled={isLoading}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e as unknown as React.FormEvent);
                  }
                }}
              />
              
              <button
                type="submit"
                disabled={isLoading || (!input.trim() && !attachment)}
                className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
