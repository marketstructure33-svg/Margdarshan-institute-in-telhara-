const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

// import AdminWhiteboard
code = code.replace(/import AdminAILab from '\.\/admin\/AdminAILab';/, "import AdminAILab from './admin/AdminAILab';\nimport { AdminWhiteboard } from './admin/AdminWhiteboard';");

// add tab button
const tabBtn = `
        <button 
          onClick={() => setActiveTab('whiteboard')}
          className={\`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 \${activeTab === 'whiteboard' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}\`}
        >
          <Presentation className="w-4 h-4" /> Live Whiteboard
        </button>`;
        
// Insert before Content Library
code = code.replace(/<button\s*onClick=\{\(\) => setActiveTab\('library'\)\}/, tabBtn + "\n<button \n          onClick={() => setActiveTab('library')}");

// Add icon Presentation if not imported from lucide-react
if (!code.includes('Presentation,')) {
  code = code.replace(/import \{ ([^\}]+) \} from "lucide-react";/, "import { $1, Presentation } from \"lucide-react\";");
}

// Add component render
code = code.replace(/\{activeTab === 'settings' && <AdminSettings \/>\}/, "{activeTab === 'settings' && <AdminSettings />}\n      {activeTab === 'whiteboard' && <AdminWhiteboard />}");

fs.writeFileSync('src/components/AdminPanel.tsx', code);
