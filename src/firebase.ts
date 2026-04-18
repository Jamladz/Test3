import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";
import firebaseConfig from "../firebase-applet-config.json";

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export const signInAnonymous = async () => {
  if (app.options.projectId === "mock-project") {
    return null; // Bypass Firebase completely for the mock project
  }
  try {
    return await signInAnonymously(auth);
  } catch (error: any) {
    console.error("Firebase Auth Error:", error?.message || String(error));
    return null;
  }
};
