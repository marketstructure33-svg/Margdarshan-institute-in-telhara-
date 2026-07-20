const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPdfNotesMaker.tsx', 'utf8');

const videoRadio = `
              <label className={\`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all \${type === 'Video' ? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'}\`}>
                <input type="radio" name="type" value="Video" checked={type === 'Video'} onChange={() => setType('Video')} className="w-4 h-4 text-red-600 focus:ring-red-500" />
                <Youtube className={\`w-5 h-5 \${type === 'Video' ? 'text-red-500' : 'text-slate-400'}\`} />
                <span className="font-bold">Video</span>
              </label>
`;

code = code.replace(
  /<label className=\{\`flex-1 flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all \$\{type === 'Notice' \? 'border-red-500 bg-red-50 text-red-700' : 'border-slate-200 hover:bg-slate-50'\}\`\}>\s*<input type="radio" name="type" value="Notice" checked=\{type === 'Notice'\} onChange=\{\(\) => setType\('Notice'\)\} className="w-4 h-4 text-red-600 focus:ring-red-500" \/>\s*<Bell className=\{\`w-5 h-5 \$\{type === 'Notice' \? 'text-red-500' : 'text-slate-400'\}\`\} \/>\s*<span className="font-bold">Notice \/ Alert<\/span>\s*<\/label>/,
  "$&" + videoRadio
);

// We should also ensure Video has content entry (description) and link entry.
// For link:
code = code.replace(
  /\{\(type === 'PDF'\) \? \(/,
  "{(type === 'PDF' || type === 'Video') ? ("
);

// For content (already fixed):
code = code.replace(
  /\{\(type === 'Note' \|\| type === 'Notice' \|\| type === 'CreatePDF'\) \? \(/,
  "{(type === 'Note' || type === 'Notice' || type === 'CreatePDF' || type === 'Video') ? ("
);

// Also need to fix the input labels
code = code.replace(
  /<label className="block text-sm font-bold text-slate-700 mb-1">P\.D\.F Link \(Google Drive, etc\.\)<\/label>/,
  '<label className="block text-sm font-bold text-slate-700 mb-1">{type === \'Video\' ? \'YouTube Video Link\' : \'P.D.F Link (Google Drive, etc.)\'}</label>'
);

code = code.replace(
  /placeholder="e\.g\. https:\/\/drive\.google\.com\/file\/d\/\.\.\."/,
  'placeholder={type === \'Video\' ? "e.g. https://youtube.com/watch?v=..." : "e.g. https://drive.google.com/file/d/..."}'
);

fs.writeFileSync('src/components/admin/AdminPdfNotesMaker.tsx', code);
