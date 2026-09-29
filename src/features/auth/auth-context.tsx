import type { JSX, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { authApi } from "@/features/auth/api";
import { clearSession, readSession, saveSession } from "@/features/auth/storage";
import type { AuthSession, PendingRegistration, UserProfile } from "@/features/auth/types";
import { onSessionExpired } from "@/lib/api-client";

type AuthContextValue = {
  initializing: boolean;
  user: UserProfile | null;
  pendingRegistration: PendingRegistration | null;
  pendingReset: { phoneNumber: string; otpCode?: string } | null;
  setPendingRegistration: (value: PendingRegistration | null) => void;
  setPendingReset: (value: { phoneNumber: string; otpCode?: string } | null) => void;
  login: (phoneNumber: string, password: string) => Promise<void>;
  register: (otpCode: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);
  const [pendingReset, setPendingReset] = useState<{
    phoneNumber: string;
    otpCode?: string;
  } | null>(null);

  useEffect(() => {
    const unsubscribe = onSessionExpired(() => setUser(null));
    void (async () => {
      try {
        if (await readSession()) setUser(await authApi.me());
      } catch {
        await clearSession();
      } finally {
        setInitializing(false);
      }
    })();
    return unsubscribe;
  }, []);

  async function acceptSession(session: AuthSession): Promise<void> {
    if (session.user.role !== "Resident") {
      await authApi.logout(session.refreshToken).catch(() => undefined);
      throw new Error("Ứng dụng này chỉ dành cho tài khoản Cư dân.");
    }
    await saveSession(session);
    setUser(session.user);
  }

  const value = useMemo<AuthContextValue>(
    () => ({
      initializing,
      user,
      pendingRegistration,
      pendingReset,
      setPendingRegistration,
      setPendingReset,
      login: async (phoneNumber, password) => {
        const session = await authApi.login(phoneNumber, password);
        await acceptSession(session);
      },
      register: async (otpCode) => {
        if (!pendingRegistration) throw new Error("Thông tin đăng ký đã hết hạn.");
        const session = await authApi.register({ ...pendingRegistration, otpCode });
        await acceptSession(session);
        setPendingRegistration(null);
      },
      logout: async () => {
        const session = await readSession();
        try {
          if (session?.refreshToken) await authApi.logout(session.refreshToken);
        } catch {
          // Local logout must succeed even when the server is unavailable.
        } finally {
          await clearSession();
          setUser(null);
        }
      },
    }),
    [initializing, pendingRegistration, pendingReset, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
