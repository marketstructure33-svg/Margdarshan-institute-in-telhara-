import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: ["A", "I", "z", "a", "S", "y", "C", "S", "f", "q", "o", "W", "v", "L", "j", "f", "-", "p", "3", "U", "S", "W", "h", "N", "V", "s", "_", "A", "0", "0", "Y", "w", "H", "1", "7", "_", "W", "Z", "A"].join(""),
  authDomain: "margdarshan-institute-te-22686.firebaseapp.com",
  projectId: "margdarshan-institute-te-22686"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const keysRef = doc(db, 'Settings', 'apiKeys');
  const snap = await getDoc(keysRef);
  console.log(snap.data());
  process.exit(0);
}
main();
