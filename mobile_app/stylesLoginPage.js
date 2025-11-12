import { StyleSheet, Platform } from "react-native";

export const colors = {
  bg: "#0B0A0E",
  panel: "rgba(18,16,24,0.78)", // glassy card
  panelBorder: "#2A1E33",
  text: "#F5F6F8",
  textDim: "#B6BAC4",
  brand: "#8a49a1",
  brandAlt: "#c1558b",
  brandPink: "#e56969",
  accent: "#ffc300",
  accentGlow: "#ffdf9e",
  btnBg: "#1A1722",

  // modal
  sheet: "rgba(16,13,22,0.95)",
  sheetBorder: "rgba(255,255,255,0.08)",
  backdrop: "rgba(0,0,0,0.45)",
};

const radius = 18;

export const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  pageWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  /** ===== Glossy 3D Card ===== */
  card: {
    position: "relative",
    width: "100%",
    maxWidth: 460,
    padding: 26,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: colors.panel,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: colors.accentGlow,
        shadowOpacity: 0.25,
        shadowRadius: 30,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 6 },
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
    color: "#ffffff",
    backgroundColor: "#FF7A00", // fallback for Android
    backgroundImage:
      "linear-gradient(90deg, #FF7A00, #FF0069, #D300C5, #7638FA)",
  },

  title: {
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
    color: colors.text,
    marginTop: 10,
    textShadowColor: "rgba(138,73,161,0.4)",
    textShadowRadius: 12,
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
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  label: {
    color: colors.textDim,
    fontSize: 12,
    marginBottom: 6,
  },
  input: {
    color: colors.text,
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "transparent",
  },

  error: {
    color: "#fca5a5",
    textAlign: "center",
    marginTop: 12,
  },

  // helpful hints
  hint: {
    marginTop: 6,
    color: "#d6d3d1",
    fontSize: 12,
  },
  hintError: {
    marginTop: 6,
    color: "#fca5a5",
    fontSize: 12,
  },

  /** ===== Primary Buttons (Neon Gradient Glow) ===== */
  ctaBtn: {
    marginTop: 22,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#FF7A00", // fallback
    backgroundImage:
      "linear-gradient(90deg, #FFD600, #FF7A00, #FF0069, #D300C5, #7638FA)",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#FF7A00",
        shadowOpacity: 0.4,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 8 },
      },
      android: { elevation: 6 },
    }),
  },
  ctaBtnDisabled: {
    opacity: 0.55,
  },
  ctaText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 5,
  },

  // ----- Sign up row -----
  signupRow: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  note: {
    color: colors.textDim,
    fontSize: 13,
  },
  signupLink: {
    color: "#FFD600",
    fontWeight: "800",
    textDecorationLine: "underline",
  },

  // ===== Modal / Bottom Sheet =====
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.backdrop,
  },
  modalSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 26,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    backgroundColor: colors.sheet,
    borderTopWidth: 1,
    borderColor: colors.sheetBorder,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: -8 },
      },
      android: { elevation: 8 },
    }),
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginBottom: 10,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    marginBottom: 6,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: colors.textDim,
    textAlign: "center",
    marginBottom: 16,
  },

  fieldWrapAlt: {
    backgroundColor: "rgba(20,18,25,0.9)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
  },

  createBtn: {
    marginTop: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: "#FF7A00",
    backgroundImage:
      "linear-gradient(90deg, #FFD600, #FF7A00, #FF0069, #D300C5, #7638FA)",
    borderWidth: 1,
  },

  sheetCancel: {
    alignSelf: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  sheetCancelText: {
    color: colors.textDim,
    fontWeight: "700",
    fontSize: 13,
  },
});
