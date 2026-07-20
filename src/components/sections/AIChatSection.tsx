import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useRef, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Send, Paperclip, Loader2, Bot, User as UserIcon, X, ArrowLeft } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  text: string;
  image?: string; // base64
  imageType?: string;
}

export default function AIChatSection({ user, onBack }: { user: User, onBack?: () => void }) {
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
      
      const formattedMessages = chatMessages.map((m: any) => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        if (m.image) {
          let base64Data = m.image;
          if (base64Data.includes(',')) base64Data = base64Data.split(',')[1];
          parts.push({ inlineData: { data: base64Data, mimeType: m.imageType || 'image/jpeg' } });
        }
        return { role: m.role === 'model' ? 'model' : 'user', parts };
      });

      
      let modelToUse = 'gemini-3.5-flash';
      const hasImages = formattedMessages.some(m => m.parts.some(p => p.inlineData));
      if (hasImages) {
        modelToUse = 'gemini-3.1-pro-preview';
      }

      const res = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages.map(m => {
            const out: any = { role: m.role };
            if (m.parts[0]?.text) out.text = m.parts[0].text;
            if (m.parts[0]?.inlineData) {
              out.image = m.parts[0].inlineData.data;
              out.imageType = m.parts[0].inlineData.mimeType;
            }
            return out;
          }),
          systemInstruction: 'You are the Margdarshan AI Tutor, an intelligent and helpful virtual assistant for students. Provide accurate, encouraging, and clear answers.',
          temperature: 0.7,
          apiKey
        })
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || "Failed to get response");
      }

      const data = await res.json();
      const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";

      setMessages(prev => [...prev, { 
         role: 'model', 
         text: replyText
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
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col w-full h-full">
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 shadow-sm overflow-hidden w-full max-w-5xl mx-auto h-full">
        <div className="bg-[#0f172a] p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 mr-1 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Back to Home</span>
              </button>
            )}
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold">Margdarshan AI Tutor</h2>
              <p className="text-xs text-slate-400">Powered by Gemini AI</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50 dark:bg-slate-900">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 md:gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <Bot className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              
              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 md:p-5 ${
                msg.role === 'user' 
                  ? 'bg-emerald-600 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm'
              }`}>
                {msg.image && (
                  <img referrerPolicy="no-referrer" src={msg.image} alt="Upload" className="max-w-full rounded-lg mb-4 max-h-80 object-cover" />
                )}
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed">
                   {msg.text.split('\n').map((line, idx) => <p key={idx} className="m-0 min-h-[1em]">{line}</p>)}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                  <UserIcon className="w-5 h-5 md:w-6 md:h-6 text-slate-600 dark:text-slate-300" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 md:w-6 md:h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm p-4 md:p-5 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Chat Input */}
        <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
          <div className="max-w-3xl mx-auto">
            {attachment && (
              <div className="mb-3 flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg w-max pr-4">
                <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded overflow-hidden">
                  <img referrerPolicy="no-referrer" src={attachment.url} alt="Preview" className="w-full h-full object-cover" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Image attached</span>
                <button 
                  onClick={() => setAttachment(null)}
                  className="ml-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 md:gap-3 bg-slate-100 dark:bg-slate-900 rounded-2xl p-2 md:p-3 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
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
                className="p-3 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-colors shrink-0"
                title="Attach Photo"
              >
                <Paperclip className="w-6 h-6" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Message AI Tutor..."
                className="flex-1 bg-transparent border-none py-3 px-2 resize-none max-h-32 min-h-[44px] focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
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
                className="p-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 dark:disabled:bg-emerald-600/30 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0"
              >
                <Send className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </form>
            <div className="text-center mt-3">
                <span className="text-xs text-slate-400">AI Tutor can make mistakes. Consider verifying important information.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
