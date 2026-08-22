import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const QUOTA_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 jam

export async function checkAnonymousQuota(cookieName: string): Promise<{ allowed: boolean }> {
  const cookieStore = await cookies();
  const lastUsedAt = cookieStore.get(cookieName)?.value;

  if (!lastUsedAt) {
    return { allowed: true };
  }

  const elapsed = Date.now() - Number(lastUsedAt);
  return { allowed: elapsed >= QUOTA_WINDOW_MS };
}

export function setQuotaCookie(response: NextResponse, cookieName: string) {
  response.cookies.set(cookieName, String(Date.now()), {
    maxAge: QUOTA_WINDOW_MS / 1000,
    httpOnly: true,
    sameSite: 'lax',
  });
}