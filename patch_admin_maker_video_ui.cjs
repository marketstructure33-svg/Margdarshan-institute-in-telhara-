const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPdfNotesMaker.tsx', 'utf8');

code = code.replace(
  /<label className="block text-sm font-bold text-slate-700 mb-1">PDF Link \(Google Drive, OneDrive, etc\.\)<\/label>/,
  '<label className="block text-sm font-bold text-slate-700 mb-1">{type === \'Video\' ? \'YouTube Video Link\' : \'PDF Link (Google Drive, etc.)\'}</label>'
);

code = code.replace(
  /placeholder="https:\/\/drive\.google\.com\/file\/d\/\.\.\."/,
  'placeholder={type === \'Video\' ? "https://youtube.com/watch?v=..." : "https://drive.google.com/file/d/..."}'
);

fs.writeFileSync('src/components/admin/AdminPdfNotesMaker.tsx', code);
