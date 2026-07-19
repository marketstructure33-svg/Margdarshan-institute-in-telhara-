const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

if (!code.includes('livetutor')) {
  code = code.replace("{ id: 'planner', label: 'AI Study Planner' },", "{ id: 'planner', label: 'AI Study Planner' },\n  { id: 'livetutor', label: 'Live Tutor' },\n  { id: 'analytics', label: 'Analytics' },");
  fs.writeFileSync('src/components/Header.tsx', code);
}
