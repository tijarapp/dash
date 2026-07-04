import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebaseAdmin';
import { SESSION_COOKIE } from '@/lib/constants';
import { DEMO_MODE, DEMO_SESSION_VALUE } from '@/lib/demo';

const FIVE_DAYS_MS = 60 * 60 * 24 * 5 * 1000;

export async function POST(request: NextRequest) {
  if (DEMO_MODE) {
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, DEMO_SESSION_VALUE, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: FIVE_DAYS_MS / 1000,
      path: '/',
    });
    return response;
  }

  const { idToken } = await request.json();
  if (!idToken) {
    return NextResponse.json({ error: 'Missing idToken' }, { status: 400 });
  }

  const decoded = await adminAuth.verifyIdToken(idToken);
  if (decoded.role !== 'admin') {
    return NextResponse.json(
      { error: 'هذا الحساب لا يملك صلاحيات الإدارة' },
      { status: 403 },
    );
  }

  const sessionCookie = await adminAuth.createSessionCookie(idToken, {
    expiresIn: FIVE_DAYS_MS,
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: FIVE_DAYS_MS / 1000,
    path: '/',
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
