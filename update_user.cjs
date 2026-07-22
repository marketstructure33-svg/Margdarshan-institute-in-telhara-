const fs = require('fs');

let code = `import React, { useRef, useEffect, useState } from 'react';
import { Presentation, Volume2, VolumeX, Mic, Maximize, Minimize } from 'lucide-react';

export type DrawMode = 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'text';
export type Point = { x: number; y: number };
export type DrawAction = {
  id: string;
  type: DrawMode;
  color: string;
  points: Point[];
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text?: string;
};

export function LiveWhiteboardSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cursor, setCursor] = useState<{x: number, y: number} | null>(null);
  
  const actionsRef = useRef<DrawAction[]>([]);
  const currentActionRef = useRef<DrawAction | null>(null);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const scale = canvas.width / 800;

    const drawAction = (action: DrawAction) => {
      ctx.beginPath();
      ctx.strokeStyle = action.type === 'eraser' ? '#ffffff' : action.color;
      ctx.lineWidth = action.type === 'eraser' ? 20 : 3;

      if (action.type === 'pen' || action.type === 'eraser') {
        if (action.points && action.points.length > 0) {
          ctx.moveTo(action.points[0].x * canvas.width, action.points[0].y * canvas.height);
          for (let i = 1; i < action.points.length; i++) {
            ctx.lineTo(action.points[i].x * canvas.width, action.points[i].y * canvas.height);
          }
        }
      } else if (action.type === 'line') {
        ctx.moveTo(action.x0 * canvas.width, action.y0 * canvas.height);
        ctx.lineTo(action.x1 * canvas.width, action.y1 * canvas.height);
      } else if (action.type === 'rect') {
        const x = action.x0 * canvas.width;
        const y = action.y0 * canvas.height;
        const w = (action.x1 - action.x0) * canvas.width;
        const h = (action.y1 - action.y0) * canvas.height;
        ctx.rect(x, y, w, h);
      } else if (action.type === 'circle') {
        const x0 = action.x0 * canvas.width;
        const y0 = action.y0 * canvas.height;
        const x1 = action.x1 * canvas.width;
        const y1 = action.y1 * canvas.height;
        const r = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
        ctx.arc(x0, y0, r, 0, 2 * Math.PI);
      } else if (action.type === 'text' && action.text) {
        ctx.font = \`\${Math.max(16, 24 * scale)}px sans-serif\`;
        ctx.fillStyle = action.color;
        ctx.fillText(action.text, action.x0 * canvas.width, action.y0 * canvas.height);
      }
      
      if (action.type !== 'text') {
        ctx.stroke();
      }
      ctx.closePath();
    };

    actionsRef.current.forEach(drawAction);
    if (currentActionRef.current) {
      drawAction(currentActionRef.current);
    }
  };

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsRef.current = new WebSocket(\`\${protocol}//\${window.location.host}/whiteboard-sync\`);
    
    wsRef.current.onopen = () => setIsConnected(true);
    wsRef.current.onclose = () => setIsConnected(false);
    
    wsRef.current.onmessage = (event) => {
      try {
        if (event.data instanceof Blob) return;
        
        const data = JSON.parse(event.data);
        
        if (data.type === 'action') {
          actionsRef.current.push(data.action);
          currentActionRef.current = null;
          redraw();
        } else if (data.type === 'live_draw') {
          currentActionRef.current = data.action;
          redraw();
        } else if (data.type === 'undo') {
          actionsRef.current.pop();
          redraw();
        } else if (data.type === 'clear') {
          actionsRef.current = [];
          currentActionRef.current = null;
          redraw();
        } else if (data.type === 'cursor') {
          setCursor({ x: data.x, y: data.y });
          if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
          cursorTimeoutRef.current = setTimeout(() => setCursor(null), 2000);
        } else if (data.type === 'audio') {
          if (audioEnabled) {
            playAudioChunk(data.data);
          }
        }
      } catch (e) {
        console.error("WebSocket message parsing error:", e);
      }
    };
    
    return () => {
      wsRef.current?.close();
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
      }
      if (cursorTimeoutRef.current) clearTimeout(cursorTimeoutRef.current);
    };
  }, [audioEnabled]);

  const playAudioChunk = (base64Audio: string) => {
    if (!audioContextRef.current) return;
    const ctx = audioContextRef.current;
    
    try {
      const binary = window.atob(base64Audio);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      
      const pcm16 = new Int16Array(bytes.buffer);
      const audioBuffer = ctx.createBuffer(1, pcm16.length, 16000);
      const channelData = audioBuffer.getChannelData(0);
      
      for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 0x8000;
      }
      
      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      
      const currentTime = ctx.currentTime;
      const playTime = Math.max(currentTime, nextStartTimeRef.current);
      source.start(playTime);
      nextStartTimeRef.current = playTime + audioBuffer.duration;
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  };

  const enableAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
      nextStartTimeRef.current = audioContextRef.current.currentTime;
    } else if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
    setAudioEnabled(true);
  };
  
  const disableAudio = () => {
    setAudioEnabled(false);
  };

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (parent) {
      canvas.width = parent.clientWidth;
      if (isFullscreen) {
        canvas.height = window.innerHeight - 150;
      } else {
        canvas.height = parent.clientWidth * 0.6;
      }
      redraw();
    }
  };

  useEffect(() => {
    setTimeout(resizeCanvas, 100);
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(\`Error attempting to enable fullscreen: \${err.message}\`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      setTimeout(resizeCanvas, 100);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div ref={containerRef} className={\`w-full max-w-7xl mx-auto space-y-6 \${isFullscreen ? 'bg-slate-50 p-6 overflow-y-auto h-screen w-screen max-w-none' : ''}\`}>
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Presentation className="w-6 h-6 text-indigo-500" />
            Live Whiteboard Class
          </h2>
          <p className="text-slate-500 mt-1">Watch and listen to the teacher's live explanations.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
          <div className="flex items-center gap-2 text-sm font-medium">
            <span className="relative flex h-3 w-3">
              {isConnected ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              )}
            </span>
            {isConnected ? <span className="text-emerald-600">Live</span> : <span className="text-red-500">Offline</span>}
          </div>
          
          {audioEnabled ? (
            <button
              onClick={disableAudio}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              <VolumeX className="w-4 h-4" />
              Mute Audio
            </button>
          ) : (
            <button
              onClick={enableAudio}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors"
            >
              <Volume2 className="w-4 h-4" />
              Join Audio
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
        {!audioEnabled && (
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm z-20 flex items-center justify-center">
            <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Join Audio to Continue</h3>
              <p className="text-slate-600 mb-6">Click below to start receiving live audio and view the whiteboard stream.</p>
              <button
                onClick={enableAudio}
                className="w-full py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
              >
                Join Audio
              </button>
            </div>
          </div>
        )}
        
        <div className="relative w-full h-full">
          <canvas
            ref={canvasRef}
            className="w-full bg-white block"
            style={{ cursor: 'default' }}
          />
          {cursor && (
            <div 
              className="absolute w-6 h-6 rounded-full border-2 border-red-500 bg-red-500/30 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 transition-all duration-75 shadow-lg shadow-red-500/50 z-10"
              style={{ left: \`\${cursor.x * 100}%\`, top: \`\${cursor.y * 100}%\` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/sections/LiveWhiteboardSection.tsx', code);
