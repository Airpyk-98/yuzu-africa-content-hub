import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "yuzu-africa-calendar-2026",
  appId: "1:589032587631:web:cc42933f811b0fb892e89a",
  storageBucket: "yuzu-africa-calendar-2026.firebasestorage.app",
  apiKey: "AIzaSyDAUQoigoYScp5CdxuASuIjOXo0oJioVpk",
  authDomain: "yuzu-africa-calendar-2026.firebaseapp.com",
  messagingSenderId: "589032587631",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
