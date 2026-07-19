'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { clientAuth } from '@/lib/firebaseClient';
import { DEMO_MODE } from '@/lib/demo';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function loginErrorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code;
  if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
    return 'البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من إنشاء المستخدم في Firebase Authentication.';
  }
  if (code === 'auth/invalid-email') {
    return 'صيغة البريد الإلكتروني غير صحيحة.';
  }
  if (code === 'auth/too-many-requests') {
    return 'محاولات كثيرة. انتظر قليلاً ثم حاول مرة أخرى.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'تسجيل الدخول بالبريد غير مفعّل. فعّل Email/Password في Firebase Console.';
  }
  return err instanceof Error ? err.message : 'تعذر تسجيل الدخول';
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState(DEMO_MODE ? 'admin@dar-alasas.demo' : '');
  const [password, setPassword] = useState(DEMO_MODE ? 'demo1234' : '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      let idToken: string | undefined;
      if (!DEMO_MODE) {
        const credential = await signInWithEmailAndPassword(
          clientAuth,
          email,
          password,
        );
        idToken = await credential.user.getIdToken();
      }
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? 'تعذر تسجيل الدخول');
      }
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(loginErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-5 shadow-sm sm:p-8"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-lg font-bold text-white">
            دا
          </div>
          <h1 className="text-xl font-bold">لوحة تحكم دار الأساس</h1>
          <p className="text-sm text-gray-500">تسجيل دخول المشرف</p>
        </div>
        {DEMO_MODE && (
          <p className="rounded-lg bg-amber-50 p-2 text-center text-xs text-amber-700">
            وضع تجريبي: اضغط «تسجيل الدخول» للدخول ببيانات وهمية
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-50 p-2 text-sm text-red-600">{error}</p>
        )}
        <input
          type="email"
          required
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-lg border border-gray-200 p-3"
        />
        <input
          type="password"
          required
          placeholder="كلمة المرور"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-lg border border-gray-200 p-3"
        />
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-blue p-3 font-semibold text-white disabled:opacity-60"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              جاري تسجيل الدخول...
            </>
          ) : (
            'تسجيل الدخول'
          )}
        </button>
      </form>
    </div>
  );
}
