// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, RecaptchaVerifier } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "mock-key-to-prevent-crash",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "mock-domain",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "mock-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "mock-bucket",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "mock-sender",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "mock-app-id",
};

let app: any;
let auth: any;
let googleProvider: any;
let db: any;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firebase services
  auth = getAuth(app);
  // Use device language for auth
  auth.useDeviceLanguage();
  googleProvider = new GoogleAuthProvider();
  db = getFirestore(app);
} catch (error: any) {
  console.error("Firebase Initialization Error:", error);
  // Render a visible fallback UI on the screen instead of a blank page crash
  if (typeof document !== 'undefined') {
    setTimeout(() => {
      const errorDiv = document.createElement('div');
      errorDiv.setAttribute('style', 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:99999; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; font-family: system-ui, sans-serif; text-align: center; background-color: #f8fafc;');
      errorDiv.innerHTML = `
        <div style="background: #fee2e2; border: 1px solid #f87171; border-radius: 1rem; padding: 2.5rem; max-width: 600px; box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);">
           <h1 style="color: #dc2626; font-size: 1.5rem; font-weight: bold; margin-bottom: 1rem;">🚨 Firebase Critical Error</h1>
           <p style="color: #991b1b; font-weight: bold; margin-bottom: 1.5rem; background: #fecaca; padding: 1rem; border-radius: 0.5rem; word-break: break-all;">
             ${error.message}
           </p>
           <div style="color: #7f1d1d; text-align: left; font-size: 0.95rem; line-height: 1.5;">
             <p style="margin-bottom: 0.5rem;"><strong>Why is this happening?</strong></p>
             <ul style="margin-left: 1.5rem; margin-bottom: 1.5rem;">
               <li>The <code>VITE_FIREBASE_API_KEY</code> in your <strong>.env</strong> file has a typo or missing character.</li>
               <li>You accidentally pasted the App ID or Project ID into the API Key field.</li>
               <li>Ensure there are NO double quotes inside the actual values in the .env file.</li>
             </ul>
             <p style="margin-bottom: 0.5rem;"><strong>How to fix:</strong></p>
             <ol style="margin-left: 1.5rem;">
               <li>Double-check your <code>.env</code> file.</li>
               <li>Once you save the file with the exact correct key, wait 2 seconds and refresh this page.</li>
             </ol>
           </div>
        </div>
      `;
      document.body.appendChild(errorDiv);
    }, 100);
  }
}

export { auth, googleProvider, db, RecaptchaVerifier };
export default app;
