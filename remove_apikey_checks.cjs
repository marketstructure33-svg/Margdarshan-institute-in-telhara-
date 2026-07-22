const fs = require('fs');

const filesToPatch = [
  'src/components/admin/AdminAILab.tsx',
  'src/components/sections/AnalyticsSection.tsx',
  'src/components/sections/NotesSection.tsx',
  'src/components/sections/LiveTutorSection.tsx',
  'src/components/sections/AIStudyPlannerSection.tsx',
  'src/components/sections/NoticeChatSection.tsx',
  'src/components/sections/AIChatSection.tsx',
  'src/components/admin/AdminChatSection.tsx'
];

filesToPatch.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Replace throw new Error
  code = code.replace(/if \(!apiKey\) \{\s*throw new Error\("API Key is missing[^"]*"\);\s*\}/g, '');
  code = code.replace(/if \(!apiKey\) \{\s*alert\("API Key is missing[^"]*"\);\s*return;\s*\}/g, '');
  code = code.replace(/if \(!apiKey\) return alert\("API Key is missing[^"]*"\);/g, '');

  fs.writeFileSync(file, code);
});
