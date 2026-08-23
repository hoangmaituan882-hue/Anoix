import { auth } from './cloudbase';

/**
 * Session helpers over the CloudBase auth client.
 * Login binds a real identity (uid) used for real-name voting; the admin
 * panel additionally checks role. All functions are null-safe when the SDK
 * failed to initialise (public site keeps working).
 */

export interface SessionUser {
  uid: string;
  email?: string;
  username?: string;
  name: string;
}

interface AuthUserLike {
  id?: string;
  uid?: string;
  email?: string;
  username?: string;
  is_anonymous?: boolean;
  user_metadata?: { name?: string; username?: string };
}

function toSessionUser(u: AuthUserLike | undefined, sub?: string): SessionUser | null {
  if (!u) return null;
  const uid = u.id ?? u.uid ?? sub ?? '';
  if (!uid) return null;
  return {
    uid,
    email: u.email || undefined,
    username: u.username || u.user_metadata?.username || undefined,
    name: u.user_metadata?.name || u.email || u.username || uid,
  };
}

/** Current signed-in user, or null when signed out / anonymous. */
export async function getSession(): Promise<SessionUser | null> {
  if (!auth) return null;
  try {
    const { data, error } = await auth.getSession();
    if (error || !data?.session) return null;
    const session = data.session as unknown as { user?: AuthUserLike; sub?: string };
    if (session.user?.is_anonymous) return null;
    return toSessionUser(session.user, session.sub);
  } catch {
    return null;
  }
}

/** Raw CloudBase access token for server-side verification (Bearer). */
export async function getAccessToken(): Promise<string | null> {
  if (!auth) return null;
  try {
    const info = await auth.getAccessToken();
    return info?.accessToken || null;
  } catch {
    return null;
  }
}

/** Sign in with a username OR email plus password. */
export async function signIn(account: string, password: string): Promise<SessionUser> {
  if (!auth) throw new Error('auth_unavailable');
  const payload = account.includes('@') ? { email: account } : { username: account };
  const { data, error } = await auth.signInWithPassword({ ...payload, password });
  if (error || !data?.session) throw new Error(error?.message ?? 'sign_in_failed');
  const user = getSession_now(data);
  return user;
}

function getSession_now(data: { session?: unknown }): SessionUser {
  const session = data.session as { user?: AuthUserLike; sub?: string } | undefined;
  return toSessionUser(session?.user, session?.sub) ?? { uid: session?.sub ?? '', name: '' };
}

/**
 * Start email self-registration. CloudBase sends a verification code to the
 * email and returns a `verifyOtp` callback on `data` to complete sign-up.
 */
export async function signUpEmail(email: string, password: string) {
  if (!auth) throw new Error('auth_unavailable');
  const { data, error } = await auth.signUp({ email, password });
  if (error) throw new Error(error.message ?? 'sign_up_failed');
  return data as { verifyOtp?: (opts: { token: string }) => Promise<unknown> };
}

export async function signOut(): Promise<void> {
  if (!auth) return;
  try {
    await auth.signOut();
  } catch {
    /* already signed out */
  }
}
