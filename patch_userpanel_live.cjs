const fs = require('fs');
let code = fs.readFileSync('src/components/UserPanel.tsx', 'utf8');

if (!code.includes('LiveTutorSection')) {
  code = code.replace("import { AnalyticsSection } from './sections/AnalyticsSection';", "import { AnalyticsSection } from './sections/AnalyticsSection';\nimport { LiveTutorSection } from './sections/LiveTutorSection';");
  
  code = code.replace("{activeTab === 'analytics' && (", `{activeTab === 'livetutor' && (
          <LiveTutorSection />
        )}
        
        {activeTab === 'analytics' && (`);
  fs.writeFileSync('src/components/UserPanel.tsx', code);
}
