import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs, onSnapshot } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Simple anonymous sign in
export const signInAnonymous = async () => {
    try {
        const cred = await signInAnonymously(auth);
        return cred.user;
    } catch (error) {
        console.error("Firebase auth error:", error);
        return null;
    }
};
