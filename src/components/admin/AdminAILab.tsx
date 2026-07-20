import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Paperclip, Loader2, Sparkles, X, ArrowLeft } from 'lucide-react';
import Markdown from 'react-markdown';

interface Message {
  role: 'user' | 'model';
  text: string;
  images?: string[];
  base64Images?: { data: string, mimeType: string }[];
}

export default function AdminAILab({ onBack }: { onBack?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: 'Welcome to the Executive AI Research Lab. I can help you draft curriculum, generate exam papers, or analyze student data patterns. You can upload multiple reference files simultaneously.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<{ url: string, base64: string, type: string }[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [apiKey, setApiKey] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      const keysRef = doc(db, 'Settings', 'apiKeys');
      const keysSnap = await getDoc(keysRef);
      if (keysSnap.exists()) {
        setApiKey(keysSnap.data().adminApiKey || null);
      }
    };
    fetchApiKey();
  }, []);


  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64String = event.target?.result as string;
        setAttachments(prev => [...prev, {
          url: URL.createObjectURL(file),
          base64: base64String.split(',')[1],
          type: file.type
        }]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && attachments.length === 0) return;

    const userMessageText = input.trim();
    const currentAttachments = [...attachments];
    
    const newUserMessage: Message = { 
      role: 'user', 
      text: userMessageText,
      images: currentAttachments.map(a => a.url),
      base64Images: currentAttachments.map(a => ({ data: a.base64, mimeType: a.type }))
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      const chatMessages = [...messages, newUserMessage].map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        if (m.base64Images) {
          m.base64Images.forEach(img => {
            parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
          });
        }
        return { role: m.role, text: m.text, parts };
      });
      
      const payloadMessages = chatMessages.map(m => {
        // format back for the /api/gemini-chat
        return {
           role: m.role,
           text: m.text,
           // Currently /api/gemini-chat supports single image, let's just pass text if we don't modify it to support multiple
        };
      });
      
      // Let's modify /api/gemini-chat to accept parts properly, but since we already have the endpoint, let's format it.
      // We pass messages to /api/gemini-chat
      
      if (!apiKey) {
        throw new Error("API Key is missing. Please configure it in the Admin Settings.");
      }
      
      const formattedMessages = [...messages, newUserMessage].map(m => {
        const parts: any[] = [];
        if (m.text) parts.push({ text: m.text });
        if (m.base64Images) {
          m.base64Images.forEach(img => {
            let base64Data = img.data;
            if (base64Data.includes(',')) base64Data = base64Data.split(',')[1];
            parts.push({ inlineData: { data: base64Data, mimeType: img.mimeType } });
          });
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
          systemInstruction: 'You are a helpful AI assistant.',
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
         text: "Error executing command. Please verify keys and connection."
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-50 dark:bg-slate-900 flex flex-col w-full h-full">
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-800 shadow-sm overflow-hidden w-full max-w-5xl mx-auto h-full">
        <div className="bg-slate-900 p-4 text-white flex items-center justify-between border-b-4 border-emerald-500">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 mr-1 hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-2 text-slate-300 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Back to Panel</span>
              </button>
            )}
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-bold">Executive AI Research Lab</h2>
              <p className="text-xs text-slate-400">Powered by Gemini Advanced</p>
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
                  ? 'bg-slate-800 text-white rounded-tr-sm' 
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-sm shadow-sm'
              }`}>
                {msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                  {msg.images.map((img, idx) => (
                    <img referrerPolicy="no-referrer" key={idx} src={img} alt="Upload" className="max-w-[200px] max-h-[200px] rounded-lg object-cover border border-slate-300 dark:border-slate-600" />
                  ))}
                  </div>
                )}
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed">
                   <Markdown>{msg.text}</Markdown>
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 text-white">
                  <User className="w-5 h-5 md:w-6 md:h-6" />
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
          <div className="max-w-4xl mx-auto">
            {attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {attachments.map((att, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 p-2 rounded-lg w-max pr-4">
                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-600 rounded overflow-hidden">
                      <img referrerPolicy="no-referrer" src={att.url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Image {idx + 1}</span>
                    <button 
                      onClick={() => removeAttachment(idx)}
                      className="ml-2 p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-end gap-2 md:gap-3 bg-slate-50 dark:bg-slate-900 rounded-2xl p-2 md:p-3 border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all">
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors shrink-0"
                title="Attach Files"
              >
                <Paperclip className="w-6 h-6" />
              </button>
              
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Give instructions to AI Lab..."
                className="flex-1 bg-transparent border-none py-3 px-2 resize-none max-h-40 min-h-[44px] focus:ring-0 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
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
                disabled={isLoading || (!input.trim() && attachments.length === 0)}
                className="p-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 dark:disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl transition-colors shrink-0 shadow-sm"
              >
                <Send className="w-5 h-5 md:w-6 md:h-6" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
