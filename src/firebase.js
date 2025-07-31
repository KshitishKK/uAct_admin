// Import necessary Firebase services
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';  // Make sure to import storage


// Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAC0Ut0eqxDunmnZIgw2Ly4NfS4stvqKyc",
  authDomain: "uact-6cfc5.firebaseapp.com",
  projectId: "uact-6cfc5",
  storageBucket: "uact-6cfc5.firebasestorage.app",  // Corrected storage bucket URL
  messagingSenderId: "83432551260",
  appId: "1:83432551260:web:492582a9e9e97274544799",
  measurementId: "G-SJSXSTZRR4"
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const db = getFirestore(app);           // Firestore initialization
const auth = getAuth(app);              // Authentication initialization
const googleProvider = new GoogleAuthProvider();  // Google authentication provider
const storage = getStorage(app);        // Storage initialization

// Export Firebase services for use in other parts of your app
export { db, auth, googleProvider, storage };















// import { initializeApp } from 'firebase/app';
// import { getFirestore } from 'firebase/firestore';
// import { getAuth, GoogleAuthProvider } from 'firebase/auth';
// import { getStorage } from 'firebase/storage'; // 👈 ADD THIS

// const firebaseConfig = {
//   apiKey: "AIzaSyAC0Ut0eqxDunmnZIgw2Ly4NfS4stvqKyc",
//   authDomain: "uact-6cfc5.firebaseapp.com",
//   projectId: "uact-6cfc5",
//   storageBucket: 'uact-6cfc5.firebasestorage.app', // ✅ FIXED (was incorrect before)
//   messagingSenderId: "83432551260",
//   appId: "1:83432551260:web:492582a9e9e97274544799",
//   measurementId: "G-SJSXSTZRR4"
// };

// // 🔧 Initialize Firebase app
// const app = initializeApp(firebaseConfig);

// // ✅ Initialize services
// const db = getFirestore(app);
// const auth = getAuth(app);
// const googleProvider = new GoogleAuthProvider();
// const storage = getStorage(app); // ✅ INIT STORAGE

// // ✅ Export them
// export { db, auth, googleProvider, storage }; // ✅ EXPORT STORAGE
