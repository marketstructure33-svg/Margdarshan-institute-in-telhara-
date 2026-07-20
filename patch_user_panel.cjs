const fs = require('fs');

let code = fs.readFileSync('src/components/UserPanel.tsx', 'utf8');

code = code.replace(
  /import \{ ScheduleCalendarSection \} from '\.\/sections\/ScheduleCalendarSection';/,
  "import { ScheduleCalendarSection } from './sections/ScheduleCalendarSection';\nimport { VideoSection } from './sections/VideoSection';"
);

code = code.replace(
  /\{activeTab === 'notes' && \(/,
  `{activeTab === 'video' && (
          <VideoSection 
            user={user}
            selectedClass={selectedClass} 
            selectedSubject={selectedSubject} 
          />
        )}
        {activeTab === 'notes' && (`
);

fs.writeFileSync('src/components/UserPanel.tsx', code);
