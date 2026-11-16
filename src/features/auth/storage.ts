import * as SecureStore from "expo-secure-store";

import type { AuthSession } from "@/features/auth/types";

const SESSION_KEY = "boxora.auth.session";
let revision = 0;
let storageQueue: Promise<void> = Promise.resolve();

export type SessionSnapshot = { readonly revision: number; readonly session: AuthSession | null };

// Keep checks and native writes/deletes in one queue: a later login must finish after old work.
function inStorageOrder<T>(action: () => Promise<T>): Promise<T> {
  const result = storageQueue.then(action);
  storageQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

async function readStoredSession(): Promise<AuthSession | null> {
  const value = await SecureStore.getItemAsync(SESSION_KEY);
  if (!value) return null;

  try {
    return JSON.parse(value) as AuthSession;
  } catch {
    revision++;
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return null;
  }
}

async function writeSession(session: AuthSession): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session), {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

export function readSessionSnapshot(): Promise<SessionSnapshot> {
  // Bind the read when requested, not when its queued native operation eventually starts.
  const sourceRevision = revision;
  return inStorageOrder(async () => {
    return { revision: sourceRevision, session: await readStoredSession() };
  });
}

export async function readSession(): Promise<AuthSession | null> {
  return (await readSessionSnapshot()).session;
}

export function isSessionCurrent(source: Pick<SessionSnapshot, "revision">): boolean {
  return source.revision === revision;
}

export function saveSession(session: AuthSession): Promise<void> {
  // Invalidate old requests immediately, even while a native storage operation is pending.
  revision++;
  return inStorageOrder(() => writeSession(session));
}

export function clearSession(): Promise<void> {
  revision++;
  return inStorageOrder(() => SecureStore.deleteItemAsync(SESSION_KEY));
}

export function saveRefreshedSession(source: SessionSnapshot, next: AuthSession): Promise<boolean> {
  return inStorageOrder(async () => {
    if (!isSessionCurrent(source)) return false;
    const current = await readStoredSession();
    if (!isSessionCurrent(source) || current?.refreshToken !== source.session?.refreshToken)
      return false;
    // Rotation stays in the same login generation so its other requests can reuse the new token.
    await writeSession(next);
    return isSessionCurrent(source);
  });
}

export function clearSessionIfCurrent(source: SessionSnapshot): Promise<number | null> {
  return inStorageOrder(async () => {
    if (!isSessionCurrent(source)) return null;
    const current = await readStoredSession();
    if (!isSessionCurrent(source) || current?.refreshToken !== source.session?.refreshToken)
      return null;
    const clearedRevision = ++revision;
    await SecureStore.deleteItemAsync(SESSION_KEY);
    return revision === clearedRevision ? clearedRevision : null;
  });
}
