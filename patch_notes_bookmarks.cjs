const fs = require('fs');
let code = fs.readFileSync('src/components/sections/NotesSection.tsx', 'utf8');

code = code.replace(
  /import \{ FileText, Loader2, ChevronDown, ChevronUp, Clock, Search, BookOpen, PenTool, Save, Trash2, X, BrainCircuit, MessageSquare, Send, Printer \} from 'lucide-react';/,
  "import { FileText, Loader2, ChevronDown, ChevronUp, Clock, Search, BookOpen, PenTool, Save, Trash2, X, BrainCircuit, MessageSquare, Send, Printer, Bookmark } from 'lucide-react';\nimport { useBookmarks } from '../../hooks/useBookmarks';"
);

code = code.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  "const [searchQuery, setSearchQuery] = useState('');\n  const { bookmarks, toggleBookmark } = useBookmarks(user);"
);

const bookmarkBtn = `
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleBookmark(note.id); }}
                    className={\`p-2 rounded-full transition-colors \${bookmarks.includes(note.id) ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300'}\`}
                    title="Bookmark Note"
                  >
                    <Bookmark className={\`w-4 h-4 \${bookmarks.includes(note.id) ? 'fill-current' : ''}\`} />
                  </button>
`;

code = code.replace(
  /<button \s*onClick=\{\(e\) => handlePrintNote\(note, e\)\}[\s\S]*?<\/button>\s*\{expandedId === note\.id \?/,
  `$&`.replace(/\{expandedId === note\.id \?/, bookmarkBtn + '\n                  {expandedId === note.id ?')
);

fs.writeFileSync('src/components/sections/NotesSection.tsx', code);
