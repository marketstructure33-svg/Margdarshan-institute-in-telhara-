const fs = require('fs');

let code = `import React, { useRef, useState, useEffect } from 'react';
import { Pen, Eraser, Trash2, Mic, MicOff, Maximize, Minimize, Square, Circle, Minus, Undo2, Type } from 'lucide-react';

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

export function AdminWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [mode, setMode] = useState<DrawMode>('pen');
  const [isAudioBroadcasting, setIsAudioBroadcasting] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [textInput, setTextInput] = useState<{visible: boolean, x: number, y: number, text: string} | null>(null);
  
  const actionsRef = useRef<DrawAction[]>([]);
  const currentActionRef = useRef<DrawAction | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsRef.current = new WebSocket(\`\${protocol}//\${window.location.host}/whiteboard-sync\`);
    
    return () => {
      wsRef.current?.close();
      stopAudio();
    };
  }, []);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioContextRef.current = new window.AudioContext({ sampleRate: 16000 });
      sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
      processorRef.current = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContextRef.current.destination);
      
      processorRef.current.onaudioprocess = (e) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          const channelData = e.inputBuffer.getChannelData(0);
          const buffer = new Int16Array(channelData.length);
          for (let i = 0; i < channelData.length; i++) {
            let s = Math.max(-1, Math.min(1, channelData[i]));
            buffer[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          const uint8 = new Uint8Array(buffer.buffer);
          let binary = '';
          for (let i = 0; i < uint8.byteLength; i++) {
            binary += String.fromCharCode(uint8[i]);
          }
          const base64 = window.btoa(binary);
          wsRef.current.send(JSON.stringify({ type: 'audio', data: base64 }));
        }
      };
      setIsAudioBroadcasting(true);
    } catch (e) {
      console.error("Failed to start audio", e);
    }
  };

  const stopAudio = () => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsAudioBroadcasting(false);
  };

  const toggleAudio = () => {
    if (isAudioBroadcasting) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Scale factor for text rendering
    const scale = canvas.width / 800; // Base text size on a hypothetical 800px width

    const drawAction = (action: DrawAction) => {
      ctx.beginPath();
      ctx.strokeStyle = action.type === 'eraser' ? '#ffffff' : action.color;
      ctx.lineWidth = action.type === 'eraser' ? 20 : 3;

      if (action.type === 'pen' || action.type === 'eraser') {
        if (action.points.length > 0) {
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

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const pos = getPos(e);
    if (!pos || !canvasRef.current) return;
    
    const normalizedPos = { x: pos.x / canvasRef.current.width, y: pos.y / canvasRef.current.height };
    
    if (mode === 'text') {
      if (textInput && textInput.text.trim()) {
         commitText(textInput.text, textInput.x, textInput.y);
      }
      setTextInput({ visible: true, x: normalizedPos.x, y: normalizedPos.y, text: '' });
      return;
    }

    currentActionRef.current = {
      id: Date.now().toString(),
      type: mode,
      color: color,
      points: [normalizedPos],
      x0: normalizedPos.x,
      y0: normalizedPos.y,
      x1: normalizedPos.x,
      y1: normalizedPos.y
    };
    setIsDrawing(true);
    redraw();
  };

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode === 'text') return;
  
    const pos = getPos(e);
    if (!pos || !canvasRef.current) return;
    const normalizedPos = { x: pos.x / canvasRef.current.width, y: pos.y / canvasRef.current.height };
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cursor', x: normalizedPos.x, y: normalizedPos.y }));
    }

    if (!isDrawing || !currentActionRef.current) return;

    if (mode === 'pen' || mode === 'eraser') {
      currentActionRef.current.points.push(normalizedPos);
    } else {
      currentActionRef.current.x1 = normalizedPos.x;
      currentActionRef.current.y1 = normalizedPos.y;
    }
    
    redraw();
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'live_draw', action: currentActionRef.current }));
    }
  };

  const handleEnd = () => {
    if (mode === 'text' || !isDrawing || !currentActionRef.current) return;
    actionsRef.current.push(currentActionRef.current);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'action', action: currentActionRef.current }));
      wsRef.current.send(JSON.stringify({ type: 'live_draw', action: null }));
    }
    
    currentActionRef.current = null;
    setIsDrawing(false);
    redraw();
  };

  const commitText = (textVal: string, tx: number, ty: number) => {
    if (!textVal.trim()) {
      setTextInput(null);
      return;
    }
    const action: DrawAction = {
      id: Date.now().toString(),
      type: 'text',
      color: color,
      points: [],
      x0: tx,
      y0: ty,
      x1: tx,
      y1: ty,
      text: textVal
    };
    actionsRef.current.push(action);
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'action', action: action }));
    }
    
    setTextInput(null);
    redraw();
  };

  const handleUndo = () => {
    if (actionsRef.current.length > 0) {
      actionsRef.current.pop();
      redraw();
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'undo' }));
      }
    }
  };

  const clearBoard = () => {
    actionsRef.current = [];
    setTextInput(null);
    redraw();
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'clear' }));
    }
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
        canvas.height = parent.clientWidth * 0.6; // 10:6 aspect ratio
      }
      redraw();
    }
  };

  useEffect(() => {
    resizeCanvas();
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

  const colors = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];
  
  // Calculate dynamic input font size
  const scale = canvasRef.current ? canvasRef.current.width / 800 : 1;
  const fontSize = Math.max(16, 24 * scale);

  return (
    <div className="p-6">
      <div ref={containerRef} className={\`flex flex-col gap-4 max-w-5xl mx-auto \${isFullscreen ? 'bg-slate-50 p-6 overflow-y-auto h-screen w-screen max-w-none' : ''}\`}>
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex gap-4 items-center">
            <h2 className="text-xl font-bold text-slate-800 mr-4">Live Whiteboard</h2>
            
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => setMode('pen')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'pen' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Pen"><Pen className="w-4 h-4" /></button>
              <button onClick={() => setMode('eraser')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'eraser' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Eraser"><Eraser className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
              <button onClick={() => setMode('rect')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'rect' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Rectangle"><Square className="w-4 h-4" /></button>
              <button onClick={() => setMode('circle')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'circle' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Circle"><Circle className="w-4 h-4" /></button>
              <button onClick={() => setMode('line')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Line"><Minus className="w-4 h-4" /></button>
              <button onClick={() => setMode('text')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Text"><Type className="w-4 h-4" /></button>
            </div>
            
            {(mode === 'pen' || mode === 'rect' || mode === 'circle' || mode === 'line' || mode === 'text') && (
              <div className="flex gap-2 items-center ml-2">
                {colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={\`w-6 h-6 rounded-full border-2 transition-all \${color === c ? 'border-indigo-600 scale-110' : 'border-transparent'}\`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleUndo}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Undo"
            >
              <Undo2 className="w-4 h-4" />
            </button>
            
            <button
              onClick={clearBoard}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
              title="Clear Board"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            
            <button
              onClick={toggleAudio}
              className={\`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors \${isAudioBroadcasting ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}\`}
            >
              {isAudioBroadcasting ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              {isAudioBroadcasting ? 'Broadcasting Audio' : 'Start Audio'}
            </button>
          </div>
        </div>
        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden touch-none relative">
          <canvas
            ref={canvasRef}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseOut={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
            onTouchCancel={handleEnd}
            className="w-full bg-white"
            style={{ cursor: mode === 'text' ? 'text' : 'crosshair' }}
          />
          {textInput?.visible && (
            <input
              autoFocus
              type="text"
              value={textInput.text}
              onChange={(e) => setTextInput({...textInput, text: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  commitText(textInput.text, textInput.x, textInput.y);
                }
              }}
              onBlur={() => commitText(textInput.text, textInput.x, textInput.y)}
              style={{
                position: 'absolute',
                left: \`\${textInput.x * 100}%\`,
                top: \`\${textInput.y * 100}%\`,
                color: color,
                font: \`\${fontSize}px sans-serif\`,
                background: 'transparent',
                border: '1px dashed #ccc',
                outline: 'none',
                transform: 'translateY(-1em)',
                minWidth: '200px'
              }}
              placeholder="Type here..."
            />
          )}
        </div>
      </div>
    </div>
  );
}
`;
fs.writeFileSync('src/components/admin/AdminWhiteboard.tsx', code);
