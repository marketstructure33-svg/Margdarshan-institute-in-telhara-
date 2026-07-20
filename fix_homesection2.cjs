const fs = require('fs');
let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

const newActions = `      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <button 
          onClick={() => setActiveTab('livetutor')}
          className="group bg-gradient-to-br from-indigo-600 to-indigo-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">Gemini Live Tutor</h3>
          <p className="text-indigo-100 text-sm mb-4">Talk real-time with an AI tutor.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Start Live Session <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          className="group bg-gradient-to-br from-violet-600 to-fuchsia-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-fuchsia-200 transition-colors">Performance Analytics</h3>
          <p className="text-white text-sm mb-4">Predictive insights for students.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            View Analytics <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
        <button 
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
          onClick={() => setActiveTab('quiz')}
          className="group bg-gradient-to-br from-rose-500 to-pink-600 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-pink-200 transition-colors">AI Quiz Generator</h3>
          <p className="text-white text-sm mb-4">Generate quizzes from your study materials.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Start Quiz <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
      </div>`;

if (!code.includes('Gemini Live Tutor')) {
  code = code.replace("      </div>\n\n      {/* Recent Views */}", "      </div>\n\n" + newActions + "\n\n      {/* Recent Views */}");
  fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
}
