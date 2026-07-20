const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminSettings.tsx', 'utf8');

// Add state for feature toggles
code = code.replace(
  /const \[userPlannerApiKey, setUserPlannerApiKey\] = useState\(''\);/,
  "const [userPlannerApiKey, setUserPlannerApiKey] = useState('');\n  const [features, setFeatures] = useState({ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true });"
);

// Fetch settings
code = code.replace(
  /if \(data\.bannerUrl\) setBannerUrl\(data\.bannerUrl\);/,
  "if (data.bannerUrl) setBannerUrl(data.bannerUrl);\n        if (data.features) setFeatures({ ...{ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true }, ...data.features });"
);

// Save settings
code = code.replace(
  /logoUrl,\n\s*bannerUrl\n\s*\}\);/,
  "logoUrl,\n        bannerUrl,\n        features\n      });"
);

const togglesUI = `
        <hr className="border-slate-100" />
        
        {/* Feature Toggles Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold flex items-center gap-2">
            <Settings className="w-5 h-5 text-slate-500" />
            Enable/Disable User Panel Features
          </h3>
          <p className="text-sm text-slate-500">Toggle which modules are visible to students in the User Panel.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries({
              pdf: 'P.D.F Materials',
              notes: 'Chapter Notes',
              video: 'Video Classes',
              livetutor: 'Live Tutor (AI)',
              analytics: 'Performance Analytics',
              schedule: 'Class Schedule',
              quiz: 'AI Quiz Generator'
            }).map(([key, label]) => (
              <label key={key} className={\`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all \${features[key as keyof typeof features] ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200 opacity-70'}\`}>
                <input 
                  type="checkbox" 
                  checked={features[key as keyof typeof features]} 
                  onChange={(e) => setFeatures({...features, [key]: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 rounded"
                />
                <span className="font-bold text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
`;

code = code.replace(
  /<hr className="border-slate-100" \/>\s*\{\/\* API Keys Section \*\/\}/,
  togglesUI.trim() + "\n\n        <hr className=\"border-slate-100\" />\n        {/* API Keys Section */}"
);

fs.writeFileSync('src/components/admin/AdminSettings.tsx', code);
