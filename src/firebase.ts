import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: "AIzaSyC3y7unXAClmBlWuqQRKVbORDqdTTyIRRA",
  authDomain: "shareplate-a5bf2.firebaseapp.com",
  projectId: "shareplate-a5bf2",
  storageBucket: "shareplate-a5bf2.firebasestorage.app",
  messagingSenderId: "915280985965",
  appId: "1:915280985965:web:1700a568f072267d61e464",
  measurementId: "G-Z7L1370V98",
}

const app = initializeApp(firebaseConfig)

// Firebase Authentication
export const auth = getAuth(app)

// Firebase Firestore
export const db = getFirestore(app)