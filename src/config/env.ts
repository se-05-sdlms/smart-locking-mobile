export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:5005/api",
  API_TIMEOUT: Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 15000,
  EAS_PROJECT_ID: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  PARCEL_DEMO: process.env.EXPO_PUBLIC_PARCEL_DEMO || "off",
} as const;
