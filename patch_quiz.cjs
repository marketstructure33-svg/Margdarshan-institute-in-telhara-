const fs = require('fs');

// Patch UserPanel.tsx
let upCode = fs.readFileSync('src/components/UserPanel.tsx', 'utf8');
if (!upCode.includes('AIQuizSection')) {
  upCode = upCode.replace(
    "import { AnalyticsSection } from './sections/AnalyticsSection';",
    "import { AnalyticsSection } from './sections/AnalyticsSection';\nimport { AIQuizSection } from './sections/AIQuizSection';"
  );
  upCode = upCode.replace(
    "{activeTab === 'analytics' && (",
    `{activeTab === 'quiz' && (
          <AIQuizSection selectedClass={selectedClass} selectedSubject={selectedSubject} />
        )}

        {activeTab === 'analytics' && (`
  );
  fs.writeFileSync('src/components/UserPanel.tsx', upCode);
}

// Patch Header.tsx
let headerCode = fs.readFileSync('src/components/Header.tsx', 'utf8');
if (!headerCode.includes('ai_quiz')) {
  headerCode = headerCode.replace(
    "{ id: 'ai_chat', label: 'AI Tutor' },",
    "{ id: 'ai_chat', label: 'AI Tutor' },\n  { id: 'quiz', label: 'AI Quiz' },"
  );
  fs.writeFileSync('src/components/Header.tsx', headerCode);
}

// Patch HomeSection.tsx
let homeCode = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');
if (!homeCode.includes('Quiz Generator')) {
  homeCode = homeCode.replace(
    `<button 
          onClick={() => setActiveTab('schedule')}`, 
`        <button 
          onClick={() => setActiveTab('quiz')}
          className="group bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-200 transition-colors">AI Quiz Generator</h3>
          <p className="text-white text-sm mb-4">Generate quizzes from your study materials.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Start Quiz <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('schedule')}`
  );
  
  // Make the grid 3 columns to accommodate 5 buttons nicely? Or leave it grid sm:grid-cols-2 lg:grid-cols-3
  fs.writeFileSync('src/components/sections/HomeSection.tsx', homeCode);
}

