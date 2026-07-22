const fs = require('fs');
let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

const newBtn = `
        <button 
          onClick={() => setActiveTab('whiteboard')}
          className="group bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Presentation className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-indigo-200 transition-colors">Live Whiteboard</h3>
          <p className="text-blue-100 text-sm">Join live interactive whiteboard classes.</p>
        </button>`;

code = code.replace(/\{features\.livetutor && \(/, newBtn + "\n        {features.livetutor && (");

if (!code.includes('Presentation,')) {
  code = code.replace(/import \{ ([^\}]+) \} from "lucide-react";/, "import { $1, Presentation } from \"lucide-react\";");
}

fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
