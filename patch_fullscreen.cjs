const fs = require('fs');

// Patch AdminWhiteboard.tsx
let adminCode = fs.readFileSync('src/components/admin/AdminWhiteboard.tsx', 'utf8');

adminCode = adminCode.replace(
  /import \{ Pen, Eraser, Trash2, Mic, MicOff \} from 'lucide-react';/,
  "import { Pen, Eraser, Trash2, Mic, MicOff, Maximize, Minimize } from 'lucide-react';"
);

adminCode = adminCode.replace(
  /const wsRef = useRef<WebSocket \| null>\(null\);/,
  `const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);`
);

const adminFsLogic = `
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
`;

adminCode = adminCode.replace(
  /const colors = \['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'\];/,
  `const colors = ['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'];\n${adminFsLogic}`
);

adminCode = adminCode.replace(
  /<div className="flex flex-col gap-4 max-w-5xl mx-auto">/,
  `<div ref={containerRef} className={\`flex flex-col gap-4 max-w-5xl mx-auto \${isFullscreen ? 'bg-slate-50 p-6 overflow-y-auto h-screen w-screen max-w-none' : ''}\`}>`
);

adminCode = adminCode.replace(
  /<button\s+onClick=\{clearBoard\}/,
  `<button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            </button>
            
            <button
              onClick={clearBoard}`
);

adminCode = adminCode.replace(
  /canvas\.height = parent\.clientWidth \* 0\.6; \/\/ 10:6 aspect ratio/,
  `if (isFullscreen) {
        canvas.height = window.innerHeight - 150;
      } else {
        canvas.height = parent.clientWidth * 0.6; // 10:6 aspect ratio
      }`
);

fs.writeFileSync('src/components/admin/AdminWhiteboard.tsx', adminCode);

// Patch LiveWhiteboardSection.tsx
let userCode = fs.readFileSync('src/components/sections/LiveWhiteboardSection.tsx', 'utf8');

userCode = userCode.replace(
  /import \{ Presentation, Volume2, VolumeX, Mic \} from 'lucide-react';/,
  "import { Presentation, Volume2, VolumeX, Mic, Maximize, Minimize } from 'lucide-react';"
);

userCode = userCode.replace(
  /const audioContextRef = useRef<AudioContext \| null>\(null\);/,
  `const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);`
);

const userFsLogic = `
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
`;

userCode = userCode.replace(
  /return \(/,
  `${userFsLogic}\n  return (`
);

userCode = userCode.replace(
  /<div className="w-full max-w-7xl mx-auto space-y-6">/,
  `<div ref={containerRef} className={\`w-full max-w-7xl mx-auto space-y-6 \${isFullscreen ? 'bg-slate-50 p-6 overflow-y-auto h-screen w-screen max-w-none' : ''}\`}>`
);

userCode = userCode.replace(
  /canvas\.height = parent\.clientWidth \* 0\.6;/,
  `if (isFullscreen) {
        canvas.height = window.innerHeight - 150;
      } else {
        canvas.height = parent.clientWidth * 0.6;
      }`
);

userCode = userCode.replace(
  /<div className="flex items-center gap-2 text-sm font-medium">/,
  `<button
              onClick={toggleFullscreen}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
            <div className="flex items-center gap-2 text-sm font-medium">`
);

fs.writeFileSync('src/components/sections/LiveWhiteboardSection.tsx', userCode);
