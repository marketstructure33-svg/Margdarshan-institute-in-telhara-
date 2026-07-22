const fs = require('fs');

let file = 'src/components/sections/NotesSection.tsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');

  // Add Bookmark to lucide-react imports if it's not there
  if (!code.includes('Bookmark')) {
    code = code.replace(/import \{ ([^\}]+) \} from 'lucide-react';/, "import { $1, Bookmark } from 'lucide-react';");
  }

  fs.writeFileSync(file, code);
}
