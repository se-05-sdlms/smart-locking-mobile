export const ENV = {
  API_URL: process.env.EXPO_PUBLIC_API_URL || "http://localhost:5005/api",
  API_TIMEOUT: Number(process.env.EXPO_PUBLIC_API_TIMEOUT) || 15000,
} as const;
