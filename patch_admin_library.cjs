const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminContentLibrary.tsx', 'utf8');

code = code.replace(
  /import \{ collection, query, onSnapshot, deleteDoc, doc \} from 'firebase\/firestore';\nimport \{ db \} from '\.\.\/\.\.\/lib\/firebase';\nimport \{ FileText, FileType, Search, Trash2, Loader2, Bell \} from 'lucide-react';/,
  "import { collection, query, onSnapshot, deleteDoc, doc } from 'firebase/firestore';\nimport { db } from '../../lib/firebase';\nimport { FileText, FileType, Search, Trash2, Loader2, Bell, Youtube } from 'lucide-react';"
);

const typeClassReplace = `
                    <span className={\`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold \${
                      item.type === 'PDF' ? 'bg-red-50 text-red-700 border border-red-200' :
                      (item.type === 'Note' || item.type === 'CreatePDF') ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      item.type === 'Video' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-purple-50 text-purple-700 border border-purple-200'
                    }\`}>
                      {item.type === 'PDF' && <FileText className="w-3.5 h-3.5" />}
                      {(item.type === 'Note' || item.type === 'CreatePDF') && <FileType className="w-3.5 h-3.5" />}
                      {item.type === 'Video' && <Youtube className="w-3.5 h-3.5" />}
                      {item.type === 'Notice' && <Bell className="w-3.5 h-3.5" />}
                      {item.type === 'CreatePDF' ? 'PDF (Generated)' : item.type}
                    </span>
`;

code = code.replace(
  /<span className=\{\`inline-flex items-center gap-1\.5 px-3 py-1 rounded-full text-xs font-bold \$\{[\s\S]*?<\/span>/,
  typeClassReplace.trim()
);

// To fix backslash interpolation
code = code.replace(/\\\$\{/g, '${');
code = code.replace(/\\`/g, '`');

fs.writeFileSync('src/components/admin/AdminContentLibrary.tsx', code);
