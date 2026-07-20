const fs = require('fs');

let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

const videoButton = `
        <button 
          onClick={() => setActiveTab('video')}
          className="group bg-gradient-to-br from-red-600 to-rose-700 p-6 rounded-2xl text-left shadow-md hover:shadow-lg transition-all"
        >
          <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-200 transition-colors">Video Classes</h3>
          <p className="text-red-100 text-sm mb-4">Watch recorded lectures and YouTube tutorials.</p>
          <div className="flex items-center text-white text-sm font-bold uppercase tracking-wider">
            Watch Videos <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </button>
`;

code = code.replace(
  /<div className="grid sm:grid-cols-2 gap-6">/,
  "<div className=\"grid sm:grid-cols-3 gap-6\">\n" + videoButton
);

fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
