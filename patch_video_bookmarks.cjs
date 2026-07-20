const fs = require('fs');
let code = fs.readFileSync('src/components/sections/VideoSection.tsx', 'utf8');

code = code.replace(
  /import \{ Youtube, Loader2, PlayCircle, Clock \} from 'lucide-react';/,
  "import { Youtube, Loader2, PlayCircle, Clock, Bookmark } from 'lucide-react';\nimport { useBookmarks } from '../../hooks/useBookmarks';"
);

code = code.replace(
  /const \[activeVideo, setActiveVideo\] = useState<StudyMaterial \| null>\(null\);/,
  "const [activeVideo, setActiveVideo] = useState<StudyMaterial | null>(null);\n  const { bookmarks, toggleBookmark } = useBookmarks(user);"
);

code = code.replace(
  /<div className="flex items-center gap-2 text-xs font-medium text-slate-500">/,
  `<div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs font-medium text-slate-500">`
);

code = code.replace(
  /\{new Date\(video\.uploadDate\)\.toLocaleDateString\(\)\}\s*<\/div>\s*<\/div>/,
  `{new Date(video.uploadDate).toLocaleDateString()}
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleBookmark(video.id); }}
                      className={\`p-1.5 rounded-md transition-colors \${bookmarks.includes(video.id) ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'}\`}
                    >
                      <Bookmark className={\`w-4 h-4 \${bookmarks.includes(video.id) ? 'fill-current' : ''}\`} />
                    </button>
                  </div>
                </div>`
);

fs.writeFileSync('src/components/sections/VideoSection.tsx', code);
