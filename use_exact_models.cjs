const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  code = code.replace(/let modelToUse = 'gemini-1\.5-flash';/g, "let modelToUse = 'gemini-3.5-flash';");
  code = code.replace(/modelToUse = 'gemini-1\.5-pro';/g, "modelToUse = 'gemini-3.1-pro-preview';");

  fs.writeFileSync(filepath, code);
}

patchFile('src/components/admin/AdminAILab.tsx');
patchFile('src/components/sections/AIChatSection.tsx');
patchFile('src/components/sections/NoticeChatSection.tsx');

// For Planner and Notes, change their models as well if we didn't patch them with modelToUse logic yet.
function patchOtherFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');
  code = code.replace(/gemini-1\.5-flash/g, "gemini-3.5-flash");
  fs.writeFileSync(filepath, code);
}
patchOtherFile('src/components/sections/AIStudyPlannerSection.tsx');
patchOtherFile('src/components/sections/NotesSection.tsx');

