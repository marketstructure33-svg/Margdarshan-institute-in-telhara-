const fs = require('fs');
let code = fs.readFileSync('src/components/sections/PdfSection.tsx', 'utf8');

code = code.replace(
  /import \{ FileText, Loader2, Download, Eye, X, Search, Printer, ExternalLink \} from 'lucide-react';/,
  "import { FileText, Loader2, Download, Eye, X, Search, Printer, ExternalLink, Bookmark } from 'lucide-react';\nimport { useBookmarks } from '../../hooks/useBookmarks';"
);

code = code.replace(
  /const \[searchQuery, setSearchQuery\] = useState\(''\);/,
  "const [searchQuery, setSearchQuery] = useState('');\n  const { bookmarks, toggleBookmark } = useBookmarks(user);"
);

const bookmarkBtn = `
                <button
                  onClick={() => toggleBookmark(pdf.id)}
                  className={\`p-2 rounded-lg transition-colors \${bookmarks.includes(pdf.id) ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 hover:text-slate-600 dark:hover:text-slate-300'}\`}
                  title="Bookmark"
                >
                  <Bookmark className={\`w-4 h-4 \${bookmarks.includes(pdf.id) ? 'fill-current' : ''}\`} />
                </button>
`;

code = code.replace(
  /<\/button>\s*<button\s*onClick=\{([^}]*?handlePrintPdf[^}]*?)\}\s*className="flex-1 flex items-center justify-center/,
  `</button>
                <button
                  onClick={$1}
                  className="flex-1 flex items-center justify-center`
);

// Actually, I can just insert the bookmark button at the end of the action buttons container.
code = code.replace(
  /<a href=\{getPdfUrl\(pdf\) \|\| ''\} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1\.5 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors">\s*<Download className="w-4 h-4" \/> Download\s*<\/a>\s*<\/div>/g,
  `<a href={getPdfUrl(pdf) || ''} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-xs sm:text-sm transition-colors">\n                  <Download className="w-4 h-4" /> Download\n                </a>\n${bookmarkBtn}\n              </div>`
);

fs.writeFileSync('src/components/sections/PdfSection.tsx', code);
