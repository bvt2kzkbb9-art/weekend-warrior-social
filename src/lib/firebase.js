import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getDatabase } from 'firebase/database';

// Production Firebase Configuration
// Weekend Warrior Social - weekend-warrior-social-c23ae
const firebaseConfig = {
  apiKey: "AIzaSyCbDrX7ZXjz_78wvYIpZt95UDElLne3EWA",
  authDomain: "weekend-warrior-social-c23ae.firebaseapp.com",
  databaseURL: "https://weekend-warrior-social-c23ae-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "weekend-warrior-social-c23ae",
  storageBucket: "weekend-warrior-social-c23ae.firebasestorage.app",
  messagingSenderId: "493489696733",
  appId: "1:493489696733:web:88173236a68210c1ca9034"
};

if (!firebaseConfig.projectId) {
  throw new Error(
    'Firebase configuration is missing. Production Firebase project weekend-warrior-social-c23ae must be configured.'
  );
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase Services
const auth = getAuth(app);
const db = getFirestore(app);
const database = getDatabase(app);
const storage = getStorage(app);

export { app, auth, db, database, storage };
