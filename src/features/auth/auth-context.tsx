import type { JSX, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { savePreferredPackage } from "@/features/account-packages/storage";
import { authApi } from "@/features/auth/api";
import { clearSession, readSession, saveSession } from "@/features/auth/storage";
import type { AuthSession, PendingRegistration, UserProfile } from "@/features/auth/types";
import { deactivatePushInstallation } from "@/features/notifications/push";
import { ApiError, onSessionExpired } from "@/lib/api-client";

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
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
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
      let cached: AuthSession | null = null;
      try {
        cached = await readSession();
        if (cached) setUser(await authApi.me());
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await clearSession();
          setUser(null);
        } else if (cached) {
          // Keep the resident session available during a network/server outage.
          setUser(cached.user);
        }
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
        // Package selection is advisory and must never block successful registration.
        await savePreferredPackage(
          session.user.id,
          pendingRegistration.accountPackageId ?? null
        ).catch(() => undefined);
        await acceptSession(session);
        setPendingRegistration(null);
      },
      logout: async () => {
        // Keep credentials for a retry if server-side cleanup fails.
        await deactivatePushInstallation();
        // Deactivation can refresh the session; revoke the latest refresh token.
        const session = await readSession();
        if (session?.refreshToken) await authApi.logout(session.refreshToken);
        await clearSession();
        setUser(null);
      },
      changePassword: async (currentPassword, newPassword) => {
        const session = await authApi.changePassword(currentPassword, newPassword);
        await acceptSession(session);
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
