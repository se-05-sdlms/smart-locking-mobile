import type { JSX, ReactNode } from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { subscribeAfterRegistration } from "@/features/account-packages/registration";
import { savePreferredPackage } from "@/features/account-packages/storage";
import { authApi } from "@/features/auth/api";
import {
  clearSession,
  clearSessionIfCurrent,
  isSessionCurrent,
  readSession,
  readSessionSnapshot,
  saveSession,
  type SessionSnapshot,
} from "@/features/auth/storage";
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
      let source: SessionSnapshot | undefined;
      try {
        source = await readSessionSnapshot();
        if (!isSessionCurrent(source)) return;
        if (source.session) {
          const restoredUser = await authApi.me();
          if (isSessionCurrent(source)) setUser(restoredUser);
        }
      } catch (error) {
        // Restoration belongs to its original login, including cached fallback and expiry cleanup.
        if (!source || !isSessionCurrent(source)) return;
        if (error instanceof ApiError && error.code === "auth/session_changed") return;
        if (error instanceof ApiError && error.status === 401) {
          const latest = await readSessionSnapshot();
          if (!isSessionCurrent(source) || latest.revision !== source.revision) return;
          const clearedRevision = await clearSessionIfCurrent(latest);
          if (clearedRevision !== null && isSessionCurrent({ revision: clearedRevision }))
            setUser(null);
        } else if (source.session) {
          // Keep the resident session available during a network/server outage.
          setUser(source.session.user);
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
        // Record the chosen package on the Backend now that the Resident is signed in (SRS UC-01).
        // It must not delay or fail registration; a failure leaves the preference for Account > Package.
        void subscribeAfterRegistration(session.user.id, pendingRegistration.accountPackageId);
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
