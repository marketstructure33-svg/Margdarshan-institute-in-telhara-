const fs = require('fs');

// Fix AdminPanel.tsx
let file = 'src/components/AdminPanel.tsx';
let code = fs.readFileSync(file, 'utf8');
if (!code.includes('import { Presentation }')) {
  code = code.replace(/import \{ ([^\}]+) \} from "lucide-react";/, "import { $1, Presentation } from 'lucide-react';");
}
fs.writeFileSync(file, code);

// Fix HomeSection.tsx
file = 'src/components/sections/HomeSection.tsx';
code = fs.readFileSync(file, 'utf8');
if (!code.includes('import { Presentation }')) {
  code = code.replace(/import \{ ([^\}]+) \} from 'lucide-react';/, "import { $1, Presentation } from 'lucide-react';");
}
fs.writeFileSync(file, code);

// Fix UserPanel.tsx
file = 'src/components/UserPanel.tsx';
code = fs.readFileSync(file, 'utf8');
// Check if LiveWhiteboardSection is imported
if (!code.includes("import { LiveWhiteboardSection }")) {
  code = code.replace(/import \{ HomeSection \} from '\.\/sections\/HomeSection';/, "import { HomeSection } from './sections/HomeSection';\nimport { LiveWhiteboardSection } from './sections/LiveWhiteboardSection';");
}
fs.writeFileSync(file, code);
