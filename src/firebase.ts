import { initializeApp } from "firebase/app"
import { connectAuthEmulator, getAuth } from "firebase/auth"
import { connectFirestoreEmulator, getFirestore } from "firebase/firestore"

// `npm run dev:emulators` sets VITE_USE_EMULATORS=true: the app then talks to
// the local Firebase emulators (throwaway "demo-shareplate" project) instead
// of the real project, so testing never touches real users or data.
export const USE_EMULATORS = import.meta.env.VITE_USE_EMULATORS === "true"

const firebaseConfig = {
  apiKey: "AIzaSyC3y7unXAClmBlWuqQRKVbORDqdTTyIRRA",
  authDomain: "shareplate-a5bf2.firebaseapp.com",
  projectId: USE_EMULATORS ? "demo-shareplate" : "shareplate-a5bf2",
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

if (USE_EMULATORS) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true })
  connectFirestoreEmulator(db, "127.0.0.1", 8080)
}
