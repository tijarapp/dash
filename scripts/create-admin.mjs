// Creates a Firebase Auth user (email/password) and grants the admin claim.
//
// Usage:
//   node scripts/create-admin.mjs admin@example.com YourPassword123
//
// Uses FIREBASE_* from .env.local, or pass a service account JSON path as 3rd arg.
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const __dirname = dirname(fileURLToPath(import.meta.url));
const email = process.argv[2];
const password = process.argv[3];
const jsonPath = process.argv[4];

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [serviceAccount.json]');
  process.exit(1);
}

function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    let val = trimmed.slice(eq + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function initAdmin() {
  if (getApps().length) return;

  if (jsonPath && existsSync(jsonPath)) {
    const sa = JSON.parse(readFileSync(jsonPath, 'utf8'));
    initializeApp({ credential: cert(sa) });
    return;
  }

  loadEnv();
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

initAdmin();
const auth = getAuth();

let user;
try {
  user = await auth.getUserByEmail(email);
  console.log(`User already exists: ${email} (${user.uid})`);
} catch (err) {
  if (err.code !== 'auth/user-not-found') throw err;
  user = await auth.createUser({ email, password, emailVerified: true });
  console.log(`Created user: ${email} (${user.uid})`);
}

await auth.setCustomUserClaims(user.uid, { role: 'admin' });
console.log(`Granted admin role to ${email}`);
console.log('\nYou can now log in at http://localhost:3000/login');
