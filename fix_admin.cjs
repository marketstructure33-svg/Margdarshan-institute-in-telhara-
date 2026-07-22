const fs = require('fs');

let file = 'src/components/AdminPanel.tsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/import \{ BookOpen \} from 'lucide-react';/, "import { BookOpen, Presentation } from 'lucide-react';");
fs.writeFileSync(file, code);

file = 'src/components/UserPanel.tsx';
code = fs.readFileSync(file, 'utf8');
if (!code.includes("import { LiveWhiteboardSection }")) {
  code = "import { LiveWhiteboardSection } from './sections/LiveWhiteboardSection';\n" + code;
}
fs.writeFileSync(file, code);
