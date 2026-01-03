import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyD9Xk1zsfmhy9p2O9twiRk9Q5OVa48M1OU",
  authDomain: "ravechi-crm.firebaseapp.com",
  projectId: "ravechi-crm",
  storageBucket: "ravechi-crm.firebasestorage.app",
  messagingSenderId: "145199039678",
  appId: "1:145199039678:web:a86bd16890a41cbe844aef",
  measurementId: "G-30KQFHMZ1W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);