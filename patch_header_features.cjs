const fs = require('fs');
let code = fs.readFileSync('src/components/Header.tsx', 'utf8');

code = code.replace(
  /const \[isMobileMenuOpen, setIsMobileMenuOpen\] = useState\(false\);/,
  "const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);\n  const [features, setFeatures] = useState({ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true });"
);

const fetchFeatures = `
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'Settings', 'appSettings'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().features) {
        setFeatures({ ...{ pdf: true, notes: true, video: true, livetutor: true, analytics: true, schedule: true, quiz: true }, ...docSnap.data().features });
      }
    });
    return () => unsubSettings();
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
`;

code = code.replace(
  /useEffect\(\(\) => \{\s*const checkAdmin = async \(\) => \{/,
  fetchFeatures + "\n\n  useEffect(() => {\n    const checkAdmin = async () => {"
);

code = code.replace(/NAV_ITEMS\.map/g, "visibleNavItems.map");

fs.writeFileSync('src/components/Header.tsx', code);
