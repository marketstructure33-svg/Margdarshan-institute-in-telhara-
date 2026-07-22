const fs = require('fs');

const adminCode = `import React, { useRef, useState, useEffect } from 'react';
import { Pen, Eraser, Trash2, Mic, MicOff, Maximize, Minimize, Square, Circle, Minus, Undo2, Type, Highlighter, Image as ImageIcon, Download, Grid, AlignJustify, MousePointer2 } from 'lucide-react';

export type DrawMode = 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'text' | 'highlighter' | 'image' | 'laser';
export type BgMode = 'blank' | 'grid' | 'lined';
export type Point = { x: number; y: number };
export type DrawAction = {
  id: string;
  type: DrawMode;
  color: string;
  width: number;
  points: Point[];
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text?: string;
  imageData?: string;
};

export function AdminWhiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const [mode, setMode] = useState<DrawMode>('pen');
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [bgMode, setBgMode] = useState<BgMode>('blank');
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
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    wsRef.current = new WebSocket(\`\${protocol}//\${window.location.host}/whiteboard-sync\`);
    
    wsRef.current.onopen = () => {
       syncState();
    };

    return () => {
      wsRef.current?.close();
      stopAudio();
    };
  }, []);

  const syncState = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'sync_bg', bgMode }));
      actionsRef.current.forEach(action => {
        wsRef.current?.send(JSON.stringify({ type: 'action', action }));
      });
    }
  };

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

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (bgMode === 'blank') return;
    
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    if (bgMode === 'grid') {
      const gridSize = 40;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (bgMode === 'lined') {
      const lineSpacing = 40;
      for (let y = lineSpacing; y <= height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const scale = canvas.width / 800;

    const drawAction = (action: DrawAction) => {
      if (action.type === 'image' && action.imageData) {
        const img = imageCacheRef.current[action.id];
        if (img) {
          ctx.drawImage(img, action.x0 * canvas.width, action.y0 * canvas.height, (action.x1 - action.x0) * canvas.width, (action.y1 - action.y0) * canvas.height);
        } else {
          const newImg = new Image();
          newImg.onload = () => {
            imageCacheRef.current[action.id] = newImg;
            redraw();
          };
          newImg.src = action.imageData;
        }
        return;
      }

      ctx.beginPath();
      
      if (action.type === 'laser') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.width;
        ctx.shadowColor = action.color;
        ctx.shadowBlur = 10;
      } else if (action.type === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = action.color + '80'; // 50% opacity
        ctx.lineWidth = action.width * 2; // thicker
        ctx.shadowBlur = 0;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = action.type === 'eraser' ? '#ffffff' : action.color;
        ctx.lineWidth = action.type === 'eraser' ? 20 : action.width;
        ctx.shadowBlur = 0;
      }

      if (action.type === 'pen' || action.type === 'eraser' || action.type === 'highlighter' || action.type === 'laser') {
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
      
      // Reset composite and shadow for next drawing
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
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
    
    if (mode === 'image') return;

    currentActionRef.current = {
      id: Date.now().toString(),
      type: mode,
      color: mode === 'laser' ? '#ef4444' : color, // Default laser to red unless specified
      width: strokeWidth,
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
    if (mode === 'text' || mode === 'image') return;
  
    const pos = getPos(e);
    if (!pos || !canvasRef.current) return;
    const normalizedPos = { x: pos.x / canvasRef.current.width, y: pos.y / canvasRef.current.height };
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'cursor', x: normalizedPos.x, y: normalizedPos.y }));
    }

    if (!isDrawing || !currentActionRef.current) return;

    if (mode === 'pen' || mode === 'eraser' || mode === 'highlighter' || mode === 'laser') {
      currentActionRef.current.points.push(normalizedPos);
      if (mode === 'laser' && currentActionRef.current.points.length > 25) {
        // Keep trail limited
        currentActionRef.current.points.shift();
      }
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
    if (mode === 'text' || mode === 'image' || !isDrawing || !currentActionRef.current) return;
    
    if (mode !== 'laser') {
      actionsRef.current.push(currentActionRef.current);
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'action', action: currentActionRef.current }));
      }
    }
    
    if (wsRef.current?.readyState === WebSocket.OPEN) {
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
      width: strokeWidth,
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const action: DrawAction = {
          id: Date.now().toString(),
          type: 'image',
          color: '#000',
          width: 0,
          points: [],
          x0: 0.1,
          y0: 0.1,
          x1: 0.5,
          y1: 0.1 + (0.4 * img.height / img.width),
          imageData: dataUrl
        };
        actionsRef.current.push(action);
        
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'action', action: action }));
        }
        redraw();
        setMode('pen');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
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

  const handleBgChange = (newBg: BgMode) => {
    setBgMode(newBg);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'sync_bg', bgMode: newBg }));
    }
    setTimeout(redraw, 50);
  };

  const exportBoard = () => {
    if (!canvasRef.current) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.fillStyle = '#ffffff';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.drawImage(canvasRef.current, 0, 0);
      
      const link = document.createElement('a');
      link.download = \`Whiteboard-\${new Date().getTime()}.png\`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
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
        canvas.height = parent.clientWidth * 0.6;
      }
      redraw();
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isFullscreen, bgMode]);

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
  const scale = canvasRef.current ? canvasRef.current.width / 800 : 1;
  const fontSize = Math.max(16, 24 * scale);

  return (
    <div className="p-6">
      <div ref={containerRef} className={\`flex flex-col gap-4 max-w-6xl mx-auto \${isFullscreen ? 'bg-slate-50 p-6 overflow-y-auto h-screen w-screen max-w-none' : ''}\`}>
        <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex-wrap gap-4">
          <div className="flex gap-4 items-center flex-wrap">
            <h2 className="text-xl font-bold text-slate-800 mr-4">Live Whiteboard Pro</h2>
            
            <div className="flex items-center bg-slate-100 rounded-lg p-1">
              <button onClick={() => setMode('pen')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'pen' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Pen"><Pen className="w-4 h-4" /></button>
              <button onClick={() => setMode('highlighter')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'highlighter' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Highlighter"><Highlighter className="w-4 h-4" /></button>
              <button onClick={() => setMode('eraser')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'eraser' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Eraser"><Eraser className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
              <button onClick={() => setMode('rect')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'rect' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Rectangle"><Square className="w-4 h-4" /></button>
              <button onClick={() => setMode('circle')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'circle' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Circle"><Circle className="w-4 h-4" /></button>
              <button onClick={() => setMode('line')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'line' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Line"><Minus className="w-4 h-4" /></button>
              <div className="w-px h-6 bg-slate-300 mx-1"></div>
              <button onClick={() => setMode('text')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'text' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Text"><Type className="w-4 h-4" /></button>
              <button onClick={() => setMode('laser')} className={\`p-2 rounded-md flex items-center transition-colors \${mode === 'laser' ? 'bg-white shadow-sm text-red-500' : 'text-slate-600 hover:bg-slate-200'}\`} title="Laser Pointer"><MousePointer2 className="w-4 h-4" /></button>
              <label className={\`p-2 rounded-md flex items-center transition-colors cursor-pointer \${mode === 'image' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`} title="Insert Image">
                <ImageIcon className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              </label>
            </div>
            
            <div className="flex gap-2 items-center ml-2 border-l border-slate-200 pl-4">
              <div className="relative rounded-md overflow-hidden w-7 h-7 border border-slate-300 shadow-sm cursor-pointer hover:scale-105 transition-transform" title="Custom Color">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer"
                />
              </div>
              {colors.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={\`w-6 h-6 rounded-full border-2 transition-all \${color === c ? 'border-slate-400 scale-110 shadow-md' : 'border-transparent hover:scale-110'}\`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
              <span className="text-xs font-medium text-slate-500 w-10">Size: {strokeWidth}</span>
              <input 
                type="range" 
                min="1" 
                max="30" 
                value={strokeWidth} 
                onChange={(e) => setStrokeWidth(Number(e.target.value))} 
                className="w-24 accent-indigo-600 cursor-pointer" 
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
             <div className="flex bg-slate-100 rounded-lg p-1 mr-2">
               <button onClick={() => handleBgChange('blank')} className={\`px-3 py-1 text-xs font-medium rounded-md \${bgMode === 'blank' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`}>Blank</button>
               <button onClick={() => handleBgChange('grid')} className={\`px-3 py-1 text-xs font-medium rounded-md \${bgMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`}><Grid className="w-3 h-3 inline mr-1"/>Grid</button>
               <button onClick={() => handleBgChange('lined')} className={\`px-3 py-1 text-xs font-medium rounded-md \${bgMode === 'lined' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-600 hover:bg-slate-200'}\`}><AlignJustify className="w-3 h-3 inline mr-1"/>Lines</button>
             </div>

            <button
              onClick={exportBoard}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Save as Image"
            >
              <Download className="w-4 h-4" />
            </button>

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
            </button>
            
            <button
              onClick={toggleAudio}
              className={\`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-xl transition-colors \${isAudioBroadcasting ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' : 'bg-indigo-600 text-white hover:bg-indigo-700'}\`}
            >
              {isAudioBroadcasting ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              <span className="hidden sm:inline">{isAudioBroadcasting ? 'Live' : 'Audio'}</span>
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
fs.writeFileSync('src/components/admin/AdminWhiteboard.tsx', adminCode);

const userCode = `import React, { useRef, useEffect, useState } from 'react';
import { Presentation, Volume2, VolumeX, Mic, Maximize, Minimize, Download } from 'lucide-react';

export type DrawMode = 'pen' | 'eraser' | 'rect' | 'circle' | 'line' | 'text' | 'highlighter' | 'image' | 'laser';
export type BgMode = 'blank' | 'grid' | 'lined';
export type Point = { x: number; y: number };
export type DrawAction = {
  id: string;
  type: DrawMode;
  color: string;
  width: number;
  points: Point[];
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  text?: string;
  imageData?: string;
};

export function LiveWhiteboardSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [cursor, setCursor] = useState<{x: number, y: number} | null>(null);
  const [bgMode, setBgMode] = useState<BgMode>('blank');
  
  const actionsRef = useRef<DrawAction[]>([]);
  const currentActionRef = useRef<DrawAction | null>(null);
  const cursorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const imageCacheRef = useRef<Record<string, HTMLImageElement>>({});
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);

  const drawBackground = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (bgMode === 'blank') return;
    
    ctx.save();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;

    if (bgMode === 'grid') {
      const gridSize = 40;
      for (let x = 0; x <= width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (bgMode === 'lined') {
      const lineSpacing = 40;
      for (let y = lineSpacing; y <= height; y += lineSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const redraw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(ctx, canvas.width, canvas.height);
    
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    const scale = canvas.width / 800;

    const drawAction = (action: DrawAction) => {
      if (action.type === 'image' && action.imageData) {
        const img = imageCacheRef.current[action.id];
        if (img) {
          ctx.drawImage(img, action.x0 * canvas.width, action.y0 * canvas.height, (action.x1 - action.x0) * canvas.width, (action.y1 - action.y0) * canvas.height);
        } else {
          const newImg = new Image();
          newImg.onload = () => {
            imageCacheRef.current[action.id] = newImg;
            redraw();
          };
          newImg.src = action.imageData;
        }
        return;
      }

      ctx.beginPath();
      
      if (action.type === 'laser') {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = action.color;
        ctx.lineWidth = action.width;
        ctx.shadowColor = action.color;
        ctx.shadowBlur = 10;
      } else if (action.type === 'highlighter') {
        ctx.globalCompositeOperation = 'multiply';
        ctx.strokeStyle = action.color + '80';
        ctx.lineWidth = action.width * 2;
        ctx.shadowBlur = 0;
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = action.type === 'eraser' ? '#ffffff' : action.color;
        ctx.lineWidth = action.type === 'eraser' ? 20 : action.width;
        ctx.shadowBlur = 0;
      }

      if (action.type === 'pen' || action.type === 'eraser' || action.type === 'highlighter' || action.type === 'laser') {
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
      
      ctx.globalCompositeOperation = 'source-over';
      ctx.shadowBlur = 0;
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
          if (!actionsRef.current.find(a => a.id === data.action.id)) {
             actionsRef.current.push(data.action);
          }
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
        } else if (data.type === 'sync_bg') {
          setBgMode(data.bgMode);
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

  const exportBoard = () => {
    if (!canvasRef.current) return;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvasRef.current.width;
    tempCanvas.height = canvasRef.current.height;
    const tCtx = tempCanvas.getContext('2d');
    if (tCtx) {
      tCtx.fillStyle = '#ffffff';
      tCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
      tCtx.drawImage(canvasRef.current, 0, 0);
      
      const link = document.createElement('a');
      link.download = \`Whiteboard-\${new Date().getTime()}.png\`;
      link.href = tempCanvas.toDataURL('image/png');
      link.click();
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
        canvas.height = parent.clientWidth * 0.6;
      }
      redraw();
    }
  };

  useEffect(() => {
    setTimeout(resizeCanvas, 100);
    window.addEventListener('resize', resizeCanvas);
    return () => window.removeEventListener('resize', resizeCanvas);
  }, [isFullscreen, bgMode]);

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
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Presentation className="w-6 h-6 text-indigo-500" />
            Live Whiteboard Class
          </h2>
          <p className="text-slate-500 mt-1">Watch and listen to the teacher's live explanations.</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={exportBoard}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            title="Save as Image"
          >
            <Download className="w-4 h-4" />
          </button>
          
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
fs.writeFileSync('src/components/sections/LiveWhiteboardSection.tsx', userCode);
