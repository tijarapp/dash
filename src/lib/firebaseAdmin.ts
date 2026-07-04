import { cert, getApps, initializeApp, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';
import { DEMO_MODE } from './demo';

function createApp(): App {
  const existing = getApps();
  if (existing.length) return existing[0];

  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey,
    }),
    storageBucket:
      process.env.FIREBASE_STORAGE_BUCKET ||
      `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
  });
}

// In demo mode we never touch Firebase, so we avoid initializing the Admin SDK
// (which would throw without real service-account credentials). These exports
// stay typed but are only ever dereferenced on the non-demo code paths.
export const adminApp = DEMO_MODE ? (null as unknown as App) : createApp();
export const adminAuth = DEMO_MODE
  ? (null as unknown as Auth)
  : getAuth(adminApp);
export const adminDb = DEMO_MODE
  ? (null as unknown as Firestore)
  : getFirestore(adminApp);
