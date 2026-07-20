const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminPdfNotesMaker.tsx', 'utf8');

code = code.replace(
  /if \(\(type === 'PDF' \|\| type === 'Video'\) && !pdfLink\) \{\s*alert\("Please enter a valid link\."\);\s*return;\s*\}\s*alert\("Please enter a valid PDF or Google Drive link\."\);\s*return;\s*\}/,
  `if ((type === 'PDF' || type === 'Video') && !pdfLink) {
      alert("Please enter a valid link.");
      return;
    }`
);

fs.writeFileSync('src/components/admin/AdminPdfNotesMaker.tsx', code);
