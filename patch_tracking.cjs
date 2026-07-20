const fs = require('fs');
let code = fs.readFileSync('src/lib/tracking.ts', 'utf8');

code = code.replace(
  /await updateDoc\(userRef, \{ recentViews \}\);/,
  `
      // Track completion
      let completedMaterials = data.completedMaterials || [];
      if (!completedMaterials.includes(material.id)) {
        completedMaterials.push(material.id);
      }
      
      await updateDoc(userRef, { recentViews, completedMaterials });
`
);

fs.writeFileSync('src/lib/tracking.ts', code);
