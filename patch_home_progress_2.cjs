const fs = require('fs');
let code = fs.readFileSync('src/components/sections/HomeSection.tsx', 'utf8');

const progressEffect = `
  useEffect(() => {
    if (!user) return;
    
    let unsubMaterials = () => {};
    let unsubUser = () => {};
    
    const setupProgress = () => {
      const q = query(
        collection(db, 'StudyMaterials'),
        where('class', '==', selectedClass),
        where('subject', '==', selectedSubject)
      );
      
      let totalMaterials = [];
      let completedIds = [];
      
      const calculateProgress = () => {
        const completedCount = totalMaterials.filter(id => completedIds.includes(id)).length;
        setProgress({ completed: completedCount, total: totalMaterials.length });
      };

      unsubMaterials = onSnapshot(q, (snapshot) => {
        totalMaterials = snapshot.docs.map(doc => doc.id);
        calculateProgress();
      });
      
      const userRef = doc(db, 'Users', user.uid);
      unsubUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().completedMaterials) {
          completedIds = docSnap.data().completedMaterials;
        } else {
          completedIds = [];
        }
        calculateProgress();
      });
    };
    
    setupProgress();
    
    return () => {
      unsubMaterials();
      unsubUser();
    };
  }, [selectedClass, selectedSubject, user]);
`;

if (!code.includes('unsubMaterials = onSnapshot(q')) {
  code = code.replace(
    /return \(\s*<div className="space-y-8">/,
    progressEffect + "\n  return (\n    <div className=\"space-y-8\">"
  );
  fs.writeFileSync('src/components/sections/HomeSection.tsx', code);
}
