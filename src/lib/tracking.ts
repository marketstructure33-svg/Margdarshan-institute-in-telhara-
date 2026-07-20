import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { StudyMaterial, RecentView } from '../types';

export const recordRecentView = async (userId: string, material: StudyMaterial) => {
  if (!userId || !material) return;
  try {
    const userRef = doc(db, 'Users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      let recentViews: RecentView[] = data.recentViews || [];
      
      // Remove if already exists to move it to top
      recentViews = recentViews.filter(v => v.id !== material.id);
      
      // Add to top
      recentViews.unshift({
        id: material.id,
        title: material.title,
        type: material.type,
        url: material.fileUrl || '',
        timestamp: Date.now()
      });
      
      // Keep only last 10
      if (recentViews.length > 10) {
        recentViews = recentViews.slice(0, 10);
      }
      
      
      // Track completion
      let completedMaterials = data.completedMaterials || [];
      if (!completedMaterials.includes(material.id)) {
        completedMaterials.push(material.id);
      }
      
      await updateDoc(userRef, { recentViews, completedMaterials });

    }
  } catch (error) {
    console.warn("Failed to record recent view", error);
  }
};
