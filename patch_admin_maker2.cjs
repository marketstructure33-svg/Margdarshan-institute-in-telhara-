const fs = require('fs');

let code = fs.readFileSync('src/components/admin/AdminPdfNotesMaker.tsx', 'utf8');

const regex = /\{\(type === 'Note' \|\| type === 'Notice' \|\| type === 'CreatePDF'\) \? \([\s\S]*?limits\.<\/p>\s*<\/div>\s*\)\}/;

const replacement = `
          {(type === 'Note' || type === 'Notice' || type === 'CreatePDF' || type === 'Video') && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {type === 'Notice' ? 'Notice Details' : type === 'Video' ? 'Video Description (Optional)' : type === 'CreatePDF' ? 'P.D.F Content (Text)' : 'Note Content / Institutional Rules'}
              </label>
              <textarea 
                value={content} 
                onChange={(e) => setContent(e.target.value)} 
                className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-sans resize-none"
                required={type === 'Note' || type === 'Notice' || type === 'CreatePDF'}
                placeholder={type === 'Notice' ? "Type announcement details..." : type === 'Video' ? "Type video description..." : type === 'CreatePDF' ? "Type content to generate P.D.F..." : "Type your notes here..."}
              />
            </div>
          )}
          
          {(type === 'PDF' || type === 'Video') && (
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">
                {type === 'Video' ? 'YouTube Video Link' : 'PDF Link (Google Drive, OneDrive, etc.)'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Link className="h-5 w-5 text-slate-400" />
                </div>
                <input 
                  type="url" 
                  value={pdfLink} 
                  onChange={(e) => setPdfLink(e.target.value)} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-red-500 outline-none font-medium"
                  required 
                  placeholder={type === 'Video' ? "https://youtube.com/watch?v=..." : "https://drive.google.com/file/d/..."}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                {type === 'Video' ? 'Paste the full YouTube video URL here.' : 'Paste the sharing link of your PDF file hosted on Google Drive or any other cloud storage.'}
              </p>
            </div>
          )}
`;

code = code.replace(regex, replacement.trim());
fs.writeFileSync('src/components/admin/AdminPdfNotesMaker.tsx', code);
