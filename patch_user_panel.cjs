const fs = require('fs');
let code = fs.readFileSync('src/components/UserPanel.tsx', 'utf8');

code = code.replace(/import \{ HomeSection \} from '\.\/sections\/HomeSection';/, "import { HomeSection } from './sections/HomeSection';\nimport { LiveWhiteboardSection } from './sections/LiveWhiteboardSection';");

const newSection = `
        {activeTab === 'whiteboard' && (
          <LiveWhiteboardSection />
        )}`;
code = code.replace(/\{activeTab === 'profile' && \(/, newSection + "\n        {activeTab === 'profile' && (");

fs.writeFileSync('src/components/UserPanel.tsx', code);
