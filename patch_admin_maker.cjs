const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPdfNotesMaker.tsx', 'utf8');

code = code.replace(
  /const \[type, setType\] = useState<'PDF' \| 'CreatePDF' \| 'Note' \| 'Notice'>\('PDF'\);/,
  "const [type, setType] = useState<'PDF' | 'CreatePDF' | 'Note' | 'Notice' | 'Video'>('PDF');"
);

code = code.replace(
  /import \{ FileText, FileType, Upload, Loader2, CheckCircle2, Bell, FilePlus, Link \} from 'lucide-react';/,
  "import { FileText, FileType, Upload, Loader2, CheckCircle2, Bell, FilePlus, Link, Youtube } from 'lucide-react';"
);

code = code.replace(
  /if \(type === 'PDF' && !pdfLink\) \{/,
  `if ((type === 'PDF' || type === 'Video') && !pdfLink) {
      alert("Please enter a valid link.");
      return;
    }`
);

code = code.replace(
  /content: \(type === 'Note' \|\| type === 'CreatePDF'\) \? content : '',/,
  "content: (type === 'Note' || type === 'CreatePDF' || type === 'Video') ? content : '',"
);

code = code.replace(
  /fileUrl: type === 'PDF' \? pdfLink : '',/,
  "fileUrl: (type === 'PDF' || type === 'Video') ? pdfLink : '',"
);

code = code.replace(
  /fileSize: type === 'PDF' \? 'Link' : '',/,
  "fileSize: (type === 'PDF' || type === 'Video') ? 'Link' : '',"
);

const typeButtons = `
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <button
              type="button"
              onClick={() => setType('PDF')}
              className={\`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all \${type === 'PDF' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:border-red-200'}\`}
            >
              <FileText className="w-6 h-6" />
              <span className="font-bold text-sm">Upload P.D.F</span>
            </button>
            <button
              type="button"
              onClick={() => setType('CreatePDF')}
              className={\`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all \${type === 'CreatePDF' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 hover:border-emerald-200'}\`}
            >
              <FilePlus className="w-6 h-6" />
              <span className="font-bold text-sm">Create P.D.F</span>
            </button>
            <button
              type="button"
              onClick={() => setType('Note')}
              className={\`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all \${type === 'Note' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-blue-200'}\`}
            >
              <FileType className="w-6 h-6" />
              <span className="font-bold text-sm">Rich Text Note</span>
            </button>
            <button
              type="button"
              onClick={() => setType('Video')}
              className={\`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all \${type === 'Video' ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-slate-200 hover:border-rose-200'}\`}
            >
              <Youtube className="w-6 h-6" />
              <span className="font-bold text-sm">YouTube Video</span>
            </button>
            <button
              type="button"
              onClick={() => setType('Notice')}
              className={\`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all \${type === 'Notice' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-slate-200 hover:border-purple-200'}\`}
            >
              <Bell className="w-6 h-6" />
              <span className="font-bold text-sm">Global Notice</span>
            </button>
          </div>
`;

code = code.replace(
  /<div className="grid grid-cols-2 md:grid-cols-4 gap-3">[\s\S]*?<\/div>\s*<\/div>\s*\{type !== 'Notice' && \(/,
  typeButtons + "\n        </div>\n\n        {type !== 'Notice' && ("
);

code = code.replace(
  /\{type === 'PDF' && \([\s\S]*?<\/div>\s*\)\}/,
  `{(type === 'PDF' || type === 'Video') && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              {type === 'Video' ? 'YouTube Video URL' : 'Google Drive / Direct PDF Link'}
            </label>
            <div className="relative">
              {type === 'Video' ? <Youtube className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /> : <Link className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />}
              <input
                type="url"
                value={pdfLink}
                onChange={(e) => setPdfLink(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all outline-none"
                placeholder={type === 'Video' ? "https://youtube.com/watch?v=..." : "https://drive.google.com/file/d/..."}
                required
              />
            </div>
          </div>
        )}`
);

code = code.replace(
  /\{\(type === 'CreatePDF' \|\| type === 'Note' \|\| type === 'Notice'\) && \(/,
  `{(type === 'CreatePDF' || type === 'Note' || type === 'Notice' || type === 'Video') && (`
);

code = code.replace(
  /placeholder=\{type === 'Notice' \? 'Enter notice details\.\.\.' : 'Enter rich text content \(Markdown supported\)\.\.\.'\}/,
  `placeholder={type === 'Notice' ? 'Enter notice details...' : type === 'Video' ? 'Enter video description / notes...' : 'Enter rich text content (Markdown supported)...'}`
);

fs.writeFileSync('src/components/admin/AdminPdfNotesMaker.tsx', code);
