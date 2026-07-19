const fs = require('fs');
let code = fs.readFileSync('src/components/UserPanel.tsx', 'utf8');

if (!code.includes('AnalyticsSection')) {
  code = code.replace("import AIStudyPlannerSection from './sections/AIStudyPlannerSection';", "import AIStudyPlannerSection from './sections/AIStudyPlannerSection';\nimport { AnalyticsSection } from './sections/AnalyticsSection';");
  
  code = code.replace("{activeTab === 'profile' && (", `{activeTab === 'analytics' && (
          <AnalyticsSection />
        )}

        {activeTab === 'profile' && (`);
  fs.writeFileSync('src/components/UserPanel.tsx', code);
}
