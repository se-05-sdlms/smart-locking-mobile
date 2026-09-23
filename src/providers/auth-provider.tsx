import * as Application from "expo-application";
import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import type { JSX, PropsWithChildren } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

import { ApiError, apiRequest } from "@/lib/api";

const SESSION_KEY = "boxora.auth.session";
const INSTALLATION_KEY = "boxora.push.installation";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type ResidentProfile = {
  id: string;
  userId: string;
  fullName: string;
  phoneNumber: string | null;
  email: string | null;
  dateOfBirth: string | null;
  avatarUrl: string | null;
  deliveryApprovalMode: 0 | 1;
  faceRecognitionEnabled: boolean;
};

type AuthUser = {
  id: string;
  phoneNumber: string | null;
  email: string | null;
  role: string;
  status: string;
  mustChangePassword: boolean;
};

type Session = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: AuthUser;
};

type PushStatus = "idle" | "registering" | "registered" | "denied" | "failed";

type AuthContextValue = {
  isReady: boolean;
  session: Session | null;
  profile: ResidentProfile | null;
  pushStatus: PushStatus;
  login: (loginIdentifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function saveSession(session: Session | null): Promise<void> {
  if (session) {
    await SecureStore.setItemAsync(SESSION_KEY, JSON.stringify(session));
  } else {
    await SecureStore.deleteItemAsync(SESSION_KEY);
  }
}

async function getInstallationId(): Promise<string | null> {
  if (Platform.OS === "android") return Application.getAndroidId();
  if (Platform.OS === "ios") return Application.getIosIdForVendorAsync();
  return null;
}

async function registerPush(accessToken: string): Promise<"registered" | "denied" | "failed"> {
  if (!Device.isDevice) return "failed";

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Thông báo Boxora",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let permissions = await Notifications.getPermissionsAsync();
  if (permissions.status !== "granted") permissions = await Notifications.requestPermissionsAsync();
  if (permissions.status !== "granted") return "denied";

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const installationId = await getInstallationId();
  if (!projectId || !installationId) return "failed";

  const expoPushToken = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  await apiRequest("/device-installations", {
    method: "PUT",
    token: accessToken,
    body: JSON.stringify({ installationId, expoPushToken, platform: Platform.OS }),
  });
  await SecureStore.setItemAsync(INSTALLATION_KEY, installationId);
  return "registered";
}

async function loadProfile(accessToken: string): Promise<ResidentProfile> {
  return apiRequest<ResidentProfile>("/residents/me", { token: accessToken });
}

export function AuthProvider({ children }: PropsWithChildren): JSX.Element {
  const [isReady, setIsReady] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<ResidentProfile | null>(null);
  const [pushStatus, setPushStatus] = useState<PushStatus>("idle");

  const syncPush = useCallback(async (accessToken: string): Promise<void> => {
    setPushStatus("registering");
    try {
      setPushStatus(await registerPush(accessToken));
    } catch {
      setPushStatus("failed");
    }
  }, []);

  useEffect(() => {
    async function restore(): Promise<void> {
      try {
        const stored = await SecureStore.getItemAsync(SESSION_KEY);
        if (!stored) return;

        let restored = JSON.parse(stored) as Session;
        try {
          setProfile(await loadProfile(restored.accessToken));
        } catch (error) {
          if (!(error instanceof ApiError) || error.status !== 401) throw error;
          restored = await apiRequest<Session>("/auth/refresh-token", {
            method: "POST",
            body: JSON.stringify({ refreshToken: restored.refreshToken }),
          });
          await saveSession(restored);
          setProfile(await loadProfile(restored.accessToken));
        }
        setSession(restored);
        void syncPush(restored.accessToken);
      } catch {
        await saveSession(null);
      } finally {
        setIsReady(true);
      }
    }

    void restore();
  }, [syncPush]);

  async function login(loginIdentifier: string, password: string): Promise<void> {
    let nextSession: Session;
    try {
      nextSession = await apiRequest<Session>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ loginIdentifier: loginIdentifier.trim(), password }),
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        throw new Error("Số điện thoại/email hoặc mật khẩu không đúng.");
      }
      throw error;
    }

    if (nextSession.user.role !== "Resident") {
      throw new Error("Ứng dụng này chỉ dành cho tài khoản cư dân.");
    }

    const nextProfile = await loadProfile(nextSession.accessToken);
    await saveSession(nextSession);
    setSession(nextSession);
    setProfile(nextProfile);
    void syncPush(nextSession.accessToken);
  }

  async function logout(): Promise<void> {
    const current = session;
    const installationId = await SecureStore.getItemAsync(INSTALLATION_KEY);

    if (current && installationId) {
      await apiRequest(`/device-installations/${encodeURIComponent(installationId)}`, {
        method: "DELETE",
        token: current.accessToken,
      }).catch(() => undefined);
      await SecureStore.deleteItemAsync(INSTALLATION_KEY);
    }
    if (current) {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refreshToken: current.refreshToken }),
      }).catch(() => undefined);
    }

    await saveSession(null);
    setSession(null);
    setProfile(null);
    setPushStatus("idle");
  }

  return (
    <AuthContext.Provider value={{ isReady, session, profile, pushStatus, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
