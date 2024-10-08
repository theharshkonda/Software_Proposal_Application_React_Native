import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore'; // Import Firestore


export const firebaseConfig = {
  apiKey: 'AIzaSyAvSG0uqy9dSFTLaZtqhPvJhu6ROIKic0M',
  authDomain: 'cehpoint-30581.firebaseapp.com',
  projectId: 'cehpoint-30581',
  storageBucket: 'cehpoint-30581.appspot.com',
  messagingSenderId: '215528592295',
  appId: '1:215528592295:android:6771852388e2eeb35d1c82',
  databaseURL: 'https://cehpoint-30581-default-rtdb.firebaseio.com/',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth
const auth = getAuth(app);

// Initialize Realtime Database
const database = getDatabase(app);

// Initialize Firestore
const db = getFirestore(app); // Initialize Firestore


export { app, auth, database, db };  // Export Firestore
