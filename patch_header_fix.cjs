const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  /const \[appLogo, setAppLogo\] = useState\('\/unnamed\.png'\);\s*useEffect\(\(\) => \{\s*const unsub = onSnapshot\(doc\(db, 'Settings', 'appSettings'\), \(docSnap\) => \{\s*if \(docSnap\.exists\(\) && docSnap\.data\(\)\.logoUrl\) \{\s*setAppLogo\(docSnap\.data\(\)\.logoUrl\);\s*\} else \{\s*setAppLogo\('\/unnamed\.png'\);\s*\}\s*\}\);\s*return \(\) => unsub\(\);\s*\}, \[\]\);\s*const handleSignOut = \(\) => \{/,
  `const [appLogo, setAppLogo] = useState('/unnamed.png');

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'Settings', 'appSettings'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.logoUrl) setAppLogo(data.logoUrl);
        if (data.features) setFeatures({ ...{ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true }, ...data.features });
      } else {
        setAppLogo('/unnamed.png');
      }
    });
    return () => unsub();
  }, []);

  const visibleNavItems = NAV_ITEMS.filter(item => {
    if (item.id === 'pdf' && !features.pdf) return false;
    if (item.id === 'notes' && !features.notes) return false;
    if (item.id === 'video' && !features.video) return false;
    if (item.id === 'livetutor' && !features.livetutor) return false;
    if (item.id === 'analytics' && !features.analytics) return false;
    if (item.id === 'schedule' && !features.schedule) return false;
    if (item.id === 'quiz' && !features.quiz) return false;
    return true;
  });

  const handleSignOut = () => {`
);

fs.writeFileSync('src/components/Header.tsx', code);
