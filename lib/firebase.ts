import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDu-U0HcklSGo859vw2PntAxWsR9T2rfr4",
  authDomain: "memory-vault-a9825.firebaseapp.com",
  projectId: "memory-vault-a9825",
  storageBucket: "memory-vault-a9825.firebasestorage.app",
  messagingSenderId: "401978081270",
  appId: "1:401978081270:web:ca430cbcb8596c3d4f11d7"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
