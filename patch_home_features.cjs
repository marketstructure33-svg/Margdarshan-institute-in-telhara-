const fs = require('fs');
let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

code = code.replace(
  /const \[recentViews, setRecentViews\] = useState<RecentView\[\]>\(\[\]\);/,
  "const [recentViews, setRecentViews] = useState<RecentView[]>([]);\n  const [features, setFeatures] = useState({ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true });"
);

code = code.replace(
  /useEffect\(\(\) => \{/,
  `useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'Settings', 'appSettings'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().features) {
        setFeatures({ ...{ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true }, ...docSnap.data().features });
      }
    });
`
);

code = code.replace(
  /return \(\) => unsub\(\);/,
  "return () => {\n      unsub();\n      unsubSettings();\n    };"
);

// We need to conditionally render the buttons
code = code.replace(
  /<button \n\s*onClick=\{\(\) => setActiveTab\('pdf'\)\}/,
  "{features.pdf && (\n        <button \n          onClick={() => setActiveTab('pdf')}"
);
code = code.replace(
  /Open Materials <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" \/>\s*<\/div>\s*<\/button>/,
  "$&" + "\n      )}"
);

code = code.replace(
  /<button \n\s*onClick=\{\(\) => setActiveTab\('notes'\)\}/,
  "{features.notes && (\n        <button \n          onClick={() => setActiveTab('notes')}"
);
code = code.replace(
  /Read Notes <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" \/>\s*<\/div>\s*<\/button>/,
  "$&" + "\n      )}"
);

code = code.replace(
  /<button \n\s*onClick=\{\(\) => setActiveTab\('video'\)\}/,
  "{features.video && (\n        <button \n          onClick={() => setActiveTab('video')}"
);
code = code.replace(
  /Watch Videos <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" \/>\s*<\/div>\s*<\/button>/,
  "$&" + "\n      )}"
);

code = code.replace(
  /<button \n\s*onClick=\{\(\) => setActiveTab\('livetutor'\)\}/,
  "{features.livetutor && (\n        <button \n          onClick={() => setActiveTab('livetutor')}"
);
code = code.replace(
  /Start Live Session <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" \/>\s*<\/div>\s*<\/button>/,
  "$&" + "\n      )}"
);

code = code.replace(
  /<button \n\s*onClick=\{\(\) => setActiveTab\('analytics'\)\}/,
  "{features.analytics && (\n        <button \n          onClick={() => setActiveTab('analytics')}"
);
code = code.replace(
  /View Analytics <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" \/>\s*<\/div>\s*<\/button>/,
  "$&" + "\n      )}"
);

code = code.replace(
  /<button \n\s*onClick=\{\(\) => setActiveTab\('schedule'\)\}/,
  "{features.schedule && (\n        <button \n          onClick={() => setActiveTab('schedule')}"
);
code = code.replace(
  /View Schedule <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" \/>\s*<\/div>\s*<\/button>/,
  "$&" + "\n      )}"
);

code = code.replace(
  /<button \n\s*onClick=\{\(\) => setActiveTab\('quiz'\)\}/,
  "{features.quiz && (\n        <button \n          onClick={() => setActiveTab('quiz')}"
);
code = code.replace(
  /Start AI Quiz <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" \/>\s*<\/div>\s*<\/button>/,
  "$&" + "\n      )}"
);

fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
