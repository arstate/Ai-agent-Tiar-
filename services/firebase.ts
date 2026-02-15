import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyA51Owi_gOx2ALLvbXY6QgaIFpQ0UVVDO0",
  authDomain: "ai-agent-tiar.firebaseapp.com",
  databaseURL: "https://ai-agent-tiar-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ai-agent-tiar",
  storageBucket: "ai-agent-tiar.firebasestorage.app",
  messagingSenderId: "858916252507",
  appId: "1:858916252507:web:75f78903c1c7cc169f887e"
};

// Initialize Firebase
// Using getApps() prevents re-initialization errors in development environments
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Realtime Database
export const db = getDatabase(app);