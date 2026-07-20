const fs = require('fs');
let code = fs.readFileSync('src/components/UserPanel.tsx', 'utf8');

code = code.replace(
  /import \{ VideoSection \} from '\.\/sections\/VideoSection';/,
  "import { VideoSection } from './sections/VideoSection';\nimport { BookmarksSection } from './sections/BookmarksSection';"
);

code = code.replace(
  /\{activeTab === 'notes' && \(/,
  `{activeTab === 'bookmarks' && (
          <BookmarksSection 
            user={user}
            setActiveTab={setActiveTab}
          />
        )}
        {activeTab === 'notes' && (`
);

fs.writeFileSync('src/components/UserPanel.tsx', code);
