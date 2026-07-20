const fs = require('fs');
let code = fs.readFileSync('src/components/AdminPanel.tsx', 'utf8');

code = code.replace(
  /import AdminSettings from '\.\/admin\/AdminSettings';/,
  "import AdminSettings from './admin/AdminSettings';\nimport AdminScheduleMaker from './admin/AdminScheduleMaker';"
);

const scheduleBtn = `
        <button 
          onClick={() => setActiveTab('schedule')}
          className={\`px-4 py-2 font-bold rounded-lg whitespace-nowrap transition-colors flex items-center gap-2 \${activeTab === 'schedule' ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}\`}
        >
          <Bell className="w-4 h-4" /> Schedule Events
        </button>
`;

code = code.replace(
  /<button\s*onClick=\{([^}]*?setActiveTab\('library'\)[^}]*?)\}[\s\S]*?<\/button>/,
  scheduleBtn + "\n$&"
);

code = code.replace(
  /\{activeTab === 'library' && <AdminContentLibrary \/>\}/,
  "{activeTab === 'schedule' && <AdminScheduleMaker />}\n      {activeTab === 'library' && <AdminContentLibrary />}"
);

fs.writeFileSync('src/components/AdminPanel.tsx', code);
