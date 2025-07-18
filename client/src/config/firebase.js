import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCsQgujKqETKICTNnmaCyFM9hA5QOnyOO0",
  authDomain: "real-time-chat-applicati-d1f54.firebaseapp.com",
  projectId: "real-time-chat-applicati-d1f54",
  storageBucket: "real-time-chat-applicati-d1f54.firebasestorage.app",
  messagingSenderId: "674248266740",
  appId: "1:674248266740:web:07fae4ebd1ef9fcb359fa1",
  measurementId: "G-JRT7FJ60WD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

export default app;