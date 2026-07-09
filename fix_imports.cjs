const fs = require('fs');

function addImports(file) {
  let content = fs.readFileSync(file, 'utf8');
  if (!content.includes("from 'firebase/firestore'")) {
    content = "import { doc, getDoc } from 'firebase/firestore';\n" + content;
  } else if (!content.includes("doc") || !content.includes("getDoc")) {
    content = content.replace(/import \{ (.*?) \} from 'firebase\/firestore';/, (match, p1) => {
      let imports = p1.split(',').map(s => s.trim());
      if (!imports.includes('doc')) imports.push('doc');
      if (!imports.includes('getDoc')) imports.push('getDoc');
      return `import { ${imports.join(', ')} } from 'firebase/firestore';`;
    });
  }
  
  if (!content.includes("import { db } from")) {
    content = "import { db } from '../../lib/firebase';\n" + content;
  }
  
  fs.writeFileSync(file, content);
}

addImports('src/components/sections/AIChatSection.tsx');
addImports('src/components/sections/NoticeChatSection.tsx');
addImports('src/components/admin/AdminAILab.tsx');
