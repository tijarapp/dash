import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { adminAuth } from './firebaseAdmin';
import { SESSION_COOKIE } from './constants';
import { DEMO_MODE, DEMO_USER } from './demo';

export interface AdminUser {
  uid: string;
  email: string | null;
  role: string;
}

/// Returns the verified admin user from the session cookie, or null.
export async function getAdminUser(): Promise<AdminUser | null> {
  const store = await cookies();
  const cookie = store.get(SESSION_COOKIE)?.value;
  if (!cookie) return null;

  if (DEMO_MODE) return DEMO_USER;

  try {
    const decoded = await adminAuth.verifySessionCookie(cookie, true);
    if (decoded.role !== 'admin') return null;
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      role: (decoded.role as string) ?? 'user',
    };
  } catch {
    return null;
  }
}

/// Guards a server component/page; redirects to /login when not an admin.
export async function requireAdmin(): Promise<AdminUser> {
  const user = await getAdminUser();
  if (!user) redirect('/login');
  return user;
}
