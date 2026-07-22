import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Bot} from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function LiveTutorSection() {
  const [isRecording, setIsRecording] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ready to start');
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        const keysRef = doc(db, 'Settings', 'apiKeys');
        const keysSnap = await getDoc(keysRef);
        if (keysSnap.exists()) {
          setApiKey(keysSnap.data().userPlannerApiKey || null);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchApiKey();
  }, []);

  const pcmToBase64 = (float32Array: Float32Array) => {
    let l = float32Array.length;
    const buf = new Int16Array(l);
    while (l--) {
      buf[l] = Math.min(1, float32Array[l]) * 0x7FFF;
    }
    const bytes = new Uint8Array(buf.buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const playAudioChunk = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    // Create output context at 24kHz if not existing
    if (!window.outputAudioCtx) {
      window.outputAudioCtx = new AudioContext({ sampleRate: 24000 });
      nextStartTimeRef.current = window.outputAudioCtx.currentTime;
    }
    const outCtx = window.outputAudioCtx as AudioContext;
    
    try {
      const binary = window.atob(base64Audio);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = outCtx.createBuffer(1, pcm16.length, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
      }

      const source = outCtx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(outCtx.destination);
      
      const currentTime = outCtx.currentTime;
      if (nextStartTimeRef.current < currentTime) {
        nextStartTimeRef.current = currentTime;
      }
      source.start(nextStartTimeRef.current);
      nextStartTimeRef.current += audioBuffer.duration;
    } catch(e) {
      console.error("Audio playback error", e);
    }
  };

  const startSession = async () => {
    

    try {
      setStatus('Connecting to Live Tutor...');
      
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/live${apiKey ? "?apiKey=" + apiKey : ""}`;
      
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = async () => {
        setStatus('Listening... (Speak now)');
        setIsRecording(true);

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        audioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
        sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
        processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
        
        sourceRef.current.connect(processorRef.current);
        processorRef.current.connect(audioContextRef.current.destination);
        
        processorRef.current.onaudioprocess = (e) => {
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            const base64 = pcmToBase64(e.inputBuffer.getChannelData(0));
            wsRef.current.send(JSON.stringify({ audio: base64 }));
          }
        };
      };

      wsRef.current.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.audio) {
          playAudioChunk(msg.audio);
        }
        if (msg.interrupted) {
          if (window.outputAudioCtx && window.outputAudioCtx.state !== 'closed') {
             window.outputAudioCtx.close().catch(() => {});
             window.outputAudioCtx = null;
          }
        }
      };

      wsRef.current.onerror = (e) => {
        console.error("WebSocket error:", e);
        setStatus("Error: Connection failed.");
        stopSession();
      };
      
      wsRef.current.onclose = () => {
        setStatus("Session ended.");
        stopSession();
      };

    } catch (e: any) {
      console.error(e);
      setStatus(`Error: ${e.message}`);
      stopSession();
    }
  };

  const stopSession = () => {
    setIsRecording(false);
    
    if (processorRef.current && sourceRef.current) {
      sourceRef.current.disconnect();
      processorRef.current.disconnect();
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    if (window.outputAudioCtx && window.outputAudioCtx.state !== 'closed') {
      window.outputAudioCtx.close().catch(() => {});
      window.outputAudioCtx = null;
    }
    
    setStatus("Ready to start");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white flex items-center justify-center gap-3">
          <Bot className="w-10 h-10 text-emerald-500" />
          Live AI Tutor
        </h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Talk naturally with our advanced AI tutor. Ask questions, practice languages, or prepare for exams through real-time voice conversations.
        </p>
      </div>

      <div className="relative">
        <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-1000 ${isRecording ? 'bg-emerald-500/30 scale-150 animate-pulse' : 'bg-transparent'}`}></div>
        <button
          onClick={isRecording ? stopSession : startSession}
          className={`relative z-10 w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/50' 
              : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/50'
          }`}
        >
          {isRecording ? (
            <MicOff className="w-12 h-12" />
          ) : (
            <Mic className="w-12 h-12" />
          )}
        </button>
      </div>
      
      <div className="text-lg font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
        {isRecording && <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span></span>}
        {status}
      </div>
    </div>
  );
}

// Global declaration for window
declare global {
  interface Window {
    outputAudioCtx?: AudioContext | null;
  }
}
