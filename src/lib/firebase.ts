import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: "thile-c590e",
  appId: "1:165472919886:web:f4b44859357852c76b7e1f",
  apiKey: "AIzaSyB40qvXH7I7AmhC2_0SSc7ruUiC6dzfAug",
  authDomain: "thile-c590e.firebaseapp.com",
  storageBucket: "thile-c590e.firebasestorage.app",
  messagingSenderId: "165472919886"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, "ai-studio-constructos-e829f19d-b8b9-4f84-98fa-12cea5259a2c");
export const googleProvider = new GoogleAuthProvider();
