const fs = require('fs');

// Patch UserPanel.tsx
let upCode = fs.readFileSync('src/components/UserPanel.tsx', 'utf8');
if (!upCode.includes('ScheduleCalendarSection')) {
  upCode = upCode.replace("import { LiveTutorSection } from './sections/LiveTutorSection';", "import { LiveTutorSection } from './sections/LiveTutorSection';\nimport { ScheduleCalendarSection } from './sections/ScheduleCalendarSection';");
  upCode = upCode.replace("{activeTab === 'profile' && (", `{activeTab === 'schedule' && (
          <ScheduleCalendarSection selectedClass={selectedClass} />
        )}

        {activeTab === 'profile' && (`);
  fs.writeFileSync('src/components/UserPanel.tsx', upCode);
}

// Patch Header.tsx
let headerCode = fs.readFileSync('src/components/Header.tsx', 'utf8');
if (!headerCode.includes('schedule')) {
  headerCode = headerCode.replace("{ id: 'notice', label: 'Notices' },", "{ id: 'schedule', label: 'Schedule' },\n  { id: 'notice', label: 'Notices' },");
  fs.writeFileSync('src/components/Header.tsx', headerCode);
}

// Patch HomeSection.tsx
let homeCode = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');
if (!homeCode.includes('Schedule')) {
  homeCode = homeCode.replace(`        <button 
          onClick={() => setActiveTab('analytics')}`, 
`        <button 
          onClick={() => setActiveTab('schedule')}
          className="group bg-gradient-to-br from-blue-600 to-cyan-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-blue-200 transition-colors">Class Schedule</h3>
          <p className="text-white text-sm mb-4">View deadlines & sync with your calendar.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            View Schedule <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}`);
  fs.writeFileSync('src/components/sections/HomeSection.tsx', homeCode);
}

