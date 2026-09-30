export type UserProfile = {
  id: string;
  phoneNumber: string | null;
  email: string | null;
  role: string;
  status: string;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt: string;
  user: UserProfile;
};

export type RegistrationLocker = {
  id: string;
  code: string;
  address: string;
};

export type PendingRegistration = {
  phoneNumber: string;
  password: string;
  fullName: string;
  registeredLockerId: string;
};
