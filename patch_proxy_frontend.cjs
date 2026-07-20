const fs = require('fs');

const getProxyUrlStr = `
const getProxyUrl = (url) => {
  if (url && url.startsWith('https://firebasestorage.googleapis.com')) {
    return \`/api/proxy-pdf?url=\${encodeURIComponent(url)}\`;
  }
  return url;
};
`;

let quiz = fs.readFileSync('src/components/sections/AIQuizSection.tsx', 'utf8');
if (!quiz.includes('getProxyUrl')) {
  quiz = quiz.replace("export function AIQuizSection", getProxyUrlStr + "\nexport function AIQuizSection");
  quiz = quiz.replace("pdfjs.getDocument(url);", "pdfjs.getDocument(getProxyUrl(url));");
  fs.writeFileSync('src/components/sections/AIQuizSection.tsx', quiz);
}

let pdf = fs.readFileSync('src/components/sections/PdfSection.tsx', 'utf8');
if (!pdf.includes('getProxyUrl')) {
  pdf = pdf.replace("export default function PdfSection", getProxyUrlStr + "\nexport default function PdfSection");
  pdf = pdf.replace("file={viewPdfUrl}", "file={getProxyUrl(viewPdfUrl)}");
  fs.writeFileSync('src/components/sections/PdfSection.tsx', pdf);
}
