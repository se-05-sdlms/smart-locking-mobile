/** Native navigator colors mirror the semantic tokens in global.css. */
export const residentPalette = {
  light: {
    canvas: "#FFFFFF",
    surface: "#F6F7F9",
    border: "#E7E9ED",
    text: "#171717",
    muted: "#626973",
    accent: "#EA580C",
    soft: "#FFF1E8",
  },
  dark: {
    canvas: "#111214",
    surface: "#1B1D21",
    border: "#363B44",
    text: "#F4F5F7",
    muted: "#A6ADB8",
    accent: "#FB923C",
    soft: "#38251B",
  },
} as const;

export const residentLayout = {
  horizontal: 20,
  rowGap: 12,
  sectionGap: 24,
  radius: 12,
  cardRadius: 20,
} as const;
