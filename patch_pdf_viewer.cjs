const fs = require('fs');
let code = fs.readFileSync('src/components/sections/PdfSection.tsx', 'utf8');

if (!code.includes('react-pdf')) {
  // Add imports
  code = "import { Document, Page, pdfjs } from 'react-pdf';\n" +
         "import 'react-pdf/dist/esm/Page/AnnotationLayer.css';\n" +
         "import 'react-pdf/dist/esm/Page/TextLayer.css';\n" + code;
         
  // Setup worker
  code = code.replace(
    "export default function PdfSection({ user, selectedClass, selectedSubject }: PdfSectionProps) {",
    "pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;\n\nexport default function PdfSection({ user, selectedClass, selectedSubject }: PdfSectionProps) {"
  );

  // Add state for PDF viewing
  code = code.replace(
    "const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);",
    "const [viewPdfUrl, setViewPdfUrl] = useState<string | null>(null);\n  const [numPages, setNumPages] = useState<number>();\n  const [pageNumber, setPageNumber] = useState<number>(1);"
  );
  
  // Replace iframe with react-pdf Document/Page
  const iframeHtml = `<iframe 
                src={\`\${viewPdfUrl}#toolbar=0\`} 
                className="w-full h-full border-none"
                title="PDF Viewer"
              />`;
              
  const reactPdfHtml = `<div className="flex-1 w-full overflow-y-auto bg-slate-200 dark:bg-slate-700 flex flex-col items-center p-4">
              <Document
                file={viewPdfUrl}
                onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                loading={
                  <div className="flex items-center justify-center p-12 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <span className="ml-3">Loading PDF...</span>
                  </div>
                }
                error={
                  <div className="bg-red-50 text-red-600 p-4 rounded-lg flex flex-col items-center">
                    <p className="font-medium mb-2">Failed to load PDF.</p>
                    <a href={viewPdfUrl} target="_blank" rel="noopener noreferrer" className="bg-red-100 hover:bg-red-200 px-4 py-2 rounded-md transition-colors text-sm font-semibold">
                      Open PDF in new tab
                    </a>
                  </div>
                }
              >
                {Array.from(new Array(numPages), (el, index) => (
                  <div key={\`page_\${index + 1}\`} className="mb-4 shadow-xl">
                    <Page 
                      pageNumber={index + 1} 
                      renderTextLayer={true}
                      renderAnnotationLayer={true}
                      className="max-w-full"
                      width={Math.min(window.innerWidth - 64, 800)}
                    />
                  </div>
                ))}
              </Document>
            </div>`;
            
  code = code.replace(iframeHtml, reactPdfHtml);
  
  // Reset pages on close
  code = code.replace(
    "onClick={() => setViewPdfUrl(null)}",
    "onClick={() => { setViewPdfUrl(null); setNumPages(undefined); }}"
  );
  
  fs.writeFileSync('src/components/sections/PdfSection.tsx', code);
}
