const fs = require('fs');

let aiQuiz = fs.readFileSync('src/components/sections/AIQuizSection.tsx', 'utf8');
aiQuiz = aiQuiz.replace(
  /pdfjs\.GlobalWorkerOptions\.workerSrc = `\/\/unpkg\.com\/pdfjs-dist@\$\{pdfjs\.version\}\/build\/pdf\.worker\.min\.mjs`;/,
  `import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';\npdfjs.GlobalWorkerOptions.workerSrc = workerSrc;`
);
fs.writeFileSync('src/components/sections/AIQuizSection.tsx', aiQuiz);

let pdfSection = fs.readFileSync('src/components/sections/PdfSection.tsx', 'utf8');
if (!pdfSection.includes('workerSrc')) {
  pdfSection = pdfSection.replace(
    "import { Document, Page, pdfjs } from 'react-pdf';",
    "import { Document, Page, pdfjs } from 'react-pdf';\nimport workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';\npdfjs.GlobalWorkerOptions.workerSrc = workerSrc;"
  );
  fs.writeFileSync('src/components/sections/PdfSection.tsx', pdfSection);
}

