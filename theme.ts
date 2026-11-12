export const theme = {
  // Colors
  background: "#F9F9FF",
  colorWhite: "#fff",
  primaryDark: "#18115C",
  primary: "#2E2A72",
  text: "#111C2D",
  textMuted: "#474650",
  placeholder: "#787682",
  lavenderSurface: "#F0F3FF",
  lavenderChip: "#E7EEFF",
  lavenderIcon: "#E3DFFF",
  peachSurface: "rgba(255, 221, 184, 0.4)",
  peachIconSurface: "rgba(254, 166, 25, 0.2)",
  peachText: "#855300",
  peachLabel: "#653E00",
  success: "#4EDEA3",
  danger: "#BA1A1A",
  white: "#FFFFFF",
  inputBorder: "#ECEBF4",
  notebook: {
    canvas: "#F0ECE3",
    paper: "#FFFCF5",
    ink: "#29291F",
    muted: "#6B685E",
    line: "#E5DFD3",
    accent: "#5958A8",
    coral: "#D98779",
    peach: "#F7DFC8",
    sage: "#E3EBCF",
    lavender: "#E8E2F8",
  },

  fontFamily: {
    regular: "PlusJakartaSans_400Regular",
    semiBold: "PlusJakartaSans_600SemiBold",
    bold: "PlusJakartaSans_700Bold",
  },

  // Reusable spacing values
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
  },

  // Screen layout
  layout: {
    screenWidth: 390,
    screenPadding: 20,
    contentWidth: 350,
    cardGap: 20,
    headerHeight: 56,
    tabBarHeight: 64,
  },

  // Form cards
  card: {
    padding: 20,
    radius: 24,
  },

  // Text inputs and picker fields
  input: {
    height: 48,
    horizontalPadding: 14,
  },

  // Intro artwork
  illustration: {
    containerSize: 84,
    imageSize: 68,
  },

  // Information notice card
  informationCard: {
    radius: 16,
  },

  // Main call-to-action button
  primaryButton: {
    height: 54,
    radius: 16,
  },
} as const;
