const fs = require('fs');

let file1 = 'src/components/sections/NotesSection.tsx';
let code1 = fs.readFileSync(file1, 'utf8');
if (!code1.includes('Bookmark')) {
  // It probably imports from lucide-react with different variables. Let's just append it.
  code1 = "import { Bookmark } from 'lucide-react';\n" + code1;
  fs.writeFileSync(file1, code1);
} else {
  // Add Bookmark to the import if not there
  if(!code1.includes('Bookmark,') && !code1.includes(', Bookmark')) {
    code1 = "import { Bookmark } from 'lucide-react';\n" + code1;
    fs.writeFileSync(file1, code1);
  }
}

let file2 = 'src/components/sections/VideoSection.tsx';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(
  /recordRecentView\(user\.uid, \{\s*id: video\.id,\s*title: video\.title,\s*type: 'Video',\s*fileUrl: video\.fileUrl\s*\}\);/,
  `recordRecentView(user.uid, {
        id: video.id,
        title: video.title,
        type: 'Video',
        fileUrl: video.youtubeUrl,
        class: video.class,
        subject: video.subject,
        uploadDate: video.uploadDate
      });`
);
fs.writeFileSync(file2, code2);
