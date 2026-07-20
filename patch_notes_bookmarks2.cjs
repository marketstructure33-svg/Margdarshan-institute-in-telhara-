const fs = require('fs');
let code = fs.readFileSync('src/components/sections/NotesSection.tsx', 'utf8');

if (!code.includes('Bookmark')) {
  code = code.replace(
    /import \{ FileType, Loader2, ChevronDown, ChevronUp, Search, Printer, BrainCircuit, X, Mic, MicOff, Plus, BookOpen, MessageSquare, FileText \} from 'lucide-react';/,
    "import { FileType, Loader2, ChevronDown, ChevronUp, Search, Printer, BrainCircuit, X, Mic, MicOff, Plus, BookOpen, MessageSquare, FileText, Bookmark } from 'lucide-react';\nimport { useBookmarks } from '../../hooks/useBookmarks';"
  );
}

if (!code.includes('useBookmarks')) {
  code = code.replace(
    /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
    "const [searchQuery, setSearchQuery] = useState('');\n  const { bookmarks, toggleBookmark } = useBookmarks(user);"
  );
}

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
  /<button\s*onClick=\{\(e\) => handlePrintNote\(note, e\)\}[\s\S]*?<\/button>/,
  `$&` + bookmarkBtn
);

fs.writeFileSync('src/components/sections/NotesSection.tsx', code);
