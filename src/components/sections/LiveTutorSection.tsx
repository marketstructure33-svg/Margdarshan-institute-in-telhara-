import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Bot, Video, VideoOff, MessageSquare, Maximize2, Minimize2 } from 'lucide-react';
import { db } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export function LiveTutorSection() {
  const [isRecording, setIsRecording] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Ready to start');
  const [transcripts, setTranscripts] = useState<{sender: 'user'|'ai', text: string}[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const videoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const captureAndSendVideo = () => {
    if (!videoRef.current || !canvasRef.current || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Data = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      wsRef.current.send(JSON.stringify({ video: base64Data }));
    }
  };

  const startSession = async () => {
    try {
      setStatus('Connecting to Live Tutor...');
      setTranscripts([]);
      
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

        if (isVideoEnabled) {
          startVideo();
        }
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
        if (msg.rawMessage) {
           const rm = msg.rawMessage;
           // Handle model transcription
           const modelText = rm.serverContent?.modelTurn?.parts?.map((p:any) => p.text).filter(Boolean).join("");
           if (modelText) {
             setTranscripts(prev => {
                const last = prev[prev.length - 1];
                if (last && last.sender === 'ai') {
                  const newArr = [...prev];
                  newArr[newArr.length - 1] = { sender: 'ai', text: last.text + modelText };
                  return newArr;
                } else {
                  return [...prev, { sender: 'ai', text: modelText }];
                }
             });
           }
           // Handle user transcription
           if (rm.serverContent?.modelTurn === undefined && rm.clientContent?.turnComplete === undefined) {
             // Let's assume input text might be somewhere or we can just show model text.
             // Actually, the Live API sends transcription events differently. Let's see if we get them.
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

  const startVideo = async () => {
    try {
      const vStream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoStreamRef.current = vStream;
      if (videoRef.current) {
        videoRef.current.srcObject = vStream;
      }
      setIsVideoEnabled(true);
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
         videoIntervalRef.current = setInterval(captureAndSendVideo, 1000); // 1 FPS
      }
    } catch(e) {
      console.error("Failed to start video", e);
    }
  };

  const stopVideo = () => {
    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    if (videoStreamRef.current) {
      videoStreamRef.current.getTracks().forEach(t => t.stop());
      videoStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoEnabled(false);
  };

  const toggleVideo = () => {
    if (isVideoEnabled) {
      stopVideo();
    } else {
      startVideo();
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
    
    stopVideo();
    setStatus("Ready to start");
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFs);
    return () => document.removeEventListener('fullscreenchange', handleFs);
  }, []);

  return (
    <div ref={containerRef} className={`flex flex-col items-center justify-center p-6 space-y-8 max-w-6xl mx-auto ${isFullscreen ? 'bg-slate-50 w-screen h-screen max-w-none overflow-y-auto' : ''}`}>
      <div className="flex justify-between w-full items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
         <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
              <Bot className="w-8 h-8 text-indigo-500" />
              Interactive AI Tutor
            </h2>
            <p className="text-slate-500 mt-1">
              Have a real-time conversation. Share your camera to show your work.
            </p>
         </div>
         <div className="flex items-center gap-3">
            <button 
               onClick={toggleFullscreen}
               className="p-3 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200 transition-colors"
               title="Toggle Fullscreen"
            >
               {isFullscreen ? <Minimize2 className="w-5 h-5"/> : <Maximize2 className="w-5 h-5"/>}
            </button>
         </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8 w-full max-w-5xl">
         
         <div className="flex-1 bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
            {/* Visualizer Background */}
            <div className={`absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-1000 ${isRecording ? 'opacity-100' : 'opacity-0'}`}>
               <div className="w-64 h-64 bg-indigo-500/10 rounded-full animate-ping" style={{animationDuration: '3s'}}></div>
               <div className="absolute w-48 h-48 bg-indigo-500/20 rounded-full animate-ping" style={{animationDuration: '2s', animationDelay: '0.5s'}}></div>
               <div className="absolute w-32 h-32 bg-indigo-500/30 rounded-full animate-ping" style={{animationDuration: '1.5s', animationDelay: '1s'}}></div>
            </div>
            
            <div className="relative z-10 flex flex-col items-center">
               <button
                 onClick={isRecording ? stopSession : startSession}
                 className={`w-32 h-32 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 hover:scale-105 ${
                   isRecording 
                     ? 'bg-red-500 text-white shadow-red-500/40' 
                     : 'bg-indigo-600 text-white shadow-indigo-500/40'
                 }`}
               >
                 {isRecording ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
               </button>
               <div className="mt-8 flex items-center gap-3">
                  <span className="relative flex h-3 w-3">
                    {isRecording ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-300"></span>
                    )}
                  </span>
                  <span className="text-lg font-medium text-slate-700">{status}</span>
               </div>
            </div>

            <div className="absolute bottom-6 right-6 z-20">
               <button
                 onClick={toggleVideo}
                 className={`flex items-center gap-2 px-4 py-3 rounded-full font-medium transition-all shadow-md ${
                    isVideoEnabled ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                 }`}
               >
                  {isVideoEnabled ? <Video className="w-5 h-5"/> : <VideoOff className="w-5 h-5"/>}
                  {isVideoEnabled ? 'Camera On' : 'Camera Off'}
               </button>
            </div>
         </div>

         {/* Right Column: Camera & Transcripts */}
         <div className="w-full md:w-[400px] flex flex-col gap-6">
            
            <div className={`bg-slate-900 rounded-3xl overflow-hidden shadow-lg border-4 transition-colors ${isVideoEnabled ? 'border-indigo-500/30' : 'border-slate-800'} relative aspect-video flex items-center justify-center`}>
               {!isVideoEnabled && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                     <VideoOff className="w-10 h-10 mb-2 opacity-50" />
                     <p className="text-sm font-medium">Camera is off</p>
                  </div>
               )}
               <video 
                 ref={videoRef} 
                 autoPlay 
                 playsInline 
                 muted 
                 className={`w-full h-full object-cover ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
               />
               <canvas ref={canvasRef} className="hidden" />
            </div>

            <div className="bg-white flex-1 rounded-3xl shadow-sm border border-slate-100 p-6 flex flex-col max-h-[500px]">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                 <MessageSquare className="w-5 h-5 text-indigo-500" />
                 Live Transcript
               </h3>
               <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                  {transcripts.length === 0 ? (
                     <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3">
                        <MessageSquare className="w-8 h-8 opacity-20" />
                        <p className="text-sm text-center">Conversation will appear here once you start the session.</p>
                     </div>
                  ) : (
                     transcripts.map((t, idx) => (
                        <div key={idx} className={`flex flex-col ${t.sender === 'user' ? 'items-end' : 'items-start'}`}>
                           <span className="text-xs font-semibold text-slate-400 mb-1 ml-1">
                              {t.sender === 'user' ? 'You' : 'AI Tutor'}
                           </span>
                           <div className={`px-4 py-3 rounded-2xl max-w-[85%] ${
                              t.sender === 'user' 
                                ? 'bg-indigo-600 text-white rounded-br-sm' 
                                : 'bg-slate-100 text-slate-700 rounded-bl-sm'
                           }`}>
                              {t.text}
                           </div>
                        </div>
                     ))
                  )}
               </div>
            </div>

         </div>

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
