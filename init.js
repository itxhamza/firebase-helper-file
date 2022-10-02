import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const initFirebase = (firebaseConfig) => {
  // Initialize Firebase
  const app = initializeApp(firebaseConfig);

  return {
    auth: () => getAuth(app),
    firestore: () => getFirestore(app),
  };
};
