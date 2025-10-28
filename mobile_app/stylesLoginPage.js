// stylesLoginPage.js
import { StyleSheet, Platform } from "react-native";

/** Instagram-inspired dark palette */
export const colors = {
  bg: "#0B0A0E",
  panel: "rgba(18,16,24,0.72)",     // glassy panel
  panelSolid: "#121018",
  panelBorder: "#2A1E33",
  text: "#F5F6F8",
  textDim: "#B6BAC4",
  brand: "#8a49a1",                  // purple
  brandAlt: "#c1558b",               // magenta
  brandPink: "#e56969",              // coral
  accent: "#ffc223",                 // warm amber
  accentGlow: "#ffdf9e",             // soft glow
  btnBg: "#1A1722",
};

const radius = 16;

export const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg, // native fallback if no CSS
  },

  pageWrap: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: "center",
  },

  card: {
    alignSelf: "center",
    width: "100%",
    maxWidth: 460,
    backgroundColor: colors.panel,
    borderColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderRadius: radius,
    padding: 22,

    // glass glow
    ...Platform.select({
      ios: {
        shadowColor: colors.brand,
        shadowOpacity: 0.22,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 4 },
      default: {},
    }),
  },

  brandRow: {
    alignItems: "center",
    marginBottom: 8,
  },
  brandBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 999,
    fontSize: 14,
    fontWeight: "800",
    color: "#1b1406",
    backgroundColor: colors.accent,
    overflow: "hidden",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    color: colors.text,
    marginTop: 10,
    textShadowColor: "rgba(138,73,161,0.35)",
    textShadowRadius: 14,
    textShadowOffset: { width: 0, height: 0 },
  },
  subtitle: {
    textAlign: "center",
    color: colors.textDim,
    marginTop: 6,
    marginBottom: 18,
  },

  fieldWrap: {
    backgroundColor: "rgba(16,13,22,0.75)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  label: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    color: colors.text,
    backgroundColor: "transparent",
    borderWidth: 0,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },

  error: {
    color: "#fca5a5",
    textAlign: "center",
    marginTop: 12,
  },

  ctaBtn: {
    marginTop: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accentGlow,

    ...Platform.select({
      ios: {
        shadowColor: colors.accentGlow,
        shadowOpacity: 0.45,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 3 },
    }),
  },
  ctaBtnDisabled: {
    opacity: 0.7,
  },
  ctaText: {
    color: "#1b1406",
    fontWeight: "900",
    fontSize: 15,
    letterSpacing: 0.3,
  },

  note: {
    textAlign: "center",
    color: colors.textDim,
    marginTop: 14,
    fontSize: 12,
  },
  link: {
    color: colors.accent,
    fontWeight: "700",
  },
});
