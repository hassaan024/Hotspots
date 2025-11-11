// stylesCreatePostPage.js
import { StyleSheet, Platform } from "react-native";

/** Instagram neon gradient palette */
export const ig = {
  bg: "#0B0A0E",
  panel: "#121018",
  panelBorder: "#2A1E33",
  text: "#F5F6F8",
  textDim: "#B6BAC4",
  accent: "#FFC300",     // warm gold
  danger: "#f87171",

  gradient: ["#FFD600", "#FF7A00", "#FF0069", "#D300C5", "#7638FA"],
  gradientFaint: ["#FFD60020", "#FF7A0020", "#FF006920", "#D300C520", "#7638FA20"],
};

const radius = 14;

export const colors = {
  bg: ig.bg,
  panel: ig.panel,
  panelBorder: ig.panelBorder,
  text: ig.text,
  textDim: ig.textDim,
  brand: "#8a49a1",
  accent: ig.accent,
  btnBg: "#1A1722",
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 12,
  },

  /* Banner */
  banner: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
    backgroundColor: "rgba(255,195,0,0.06)",
    borderColor: colors.accent,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOpacity: 0.18,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  bannerText: {
    color: colors.accent,
    fontWeight: "700",
    marginLeft: 8,
  },

  /* Title */
  /** ===== Title Bubble (Neon Gradient Style) ===== */
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    marginTop: 6,
  },
  titleBubble: {
    borderRadius: 40,
    paddingHorizontal: 15,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",

    // Instagram-style gradient glow
    backgroundColor: "#FF7A00",
    backgroundImage:
      "linear-gradient(90deg, #FFD600, #FF7A00, #FF0069, #D300C5, #7638FA)",
    // shadowColor: "#FF7A00",
    // shadowOpacity: 0.5,
    // shadowRadius: 10,
    // shadowOffset: { width: 0, height: 3 },
    // borderWidth: 1,
    // borderColor: "rgba(255,255,255,0.2)",
  },

  title: {
    color: "#fff",
    fontSize: 17, // subtle and clean
    fontWeight: "800",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowRadius: 6,
  },

  /* Composer Card */
  card: {
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: radius,
    padding: 14,
    flex: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },

  /* ===== Gradient Outline Utilities ===== */
  // Use with <LinearGradient colors={ig.gradient} style={styles.ring}>
  ring: {
    padding: 2, // ring thickness
    borderRadius: 12,
  },
  ringFaint: {
    padding: 2,
    borderRadius: 12,
  },
  ringInner: {
    borderRadius: 10,
    backgroundColor: "#0f141b", // dark inner surface
    borderWidth: 1,
    borderColor: colors.panelBorder,
    overflow: "hidden",
  },

  /* Preview with gradient outline */
  previewRing: {
    padding: 2,
    borderRadius: 14,
    marginBottom: 12,
  },
  previewInner: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    overflow: "hidden",
    backgroundColor: "#0f141b",
    height: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.textDim,
    marginTop: 8,
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  // Pill button with faint gradient ring
  pillRing: {
    padding: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  pillInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17141f",
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    color: colors.text,
    fontWeight: "600",
    marginLeft: 6,
  },

  // Ghost pill (outline only)
  pillGhostRing: {
    padding: 2,
    borderRadius: 12,
    marginRight: 8,
  },
  pillGhostInner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  actionBtnGhostText: {
    color: colors.textDim,
    fontWeight: "600",
    marginLeft: 6,
  },

  /* Caption */
  captionWrap: {
    marginTop: 4,
    marginBottom: 12,
  },
  captionLabel: {
    color: colors.textDim,
    marginBottom: 6,
    fontSize: 12,
  },
  // Field with gradient ring
  fieldRing: {
    padding: 2,
    borderRadius: 12,
  },
  captionInner: {
    minHeight: 84,
    maxHeight: 140,
    color: colors.text,
    backgroundColor: "#0f141b",
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: "top",
  },
  captionCount: {
    alignSelf: "flex-end",
    color: colors.textDim,
    marginTop: 6,
    fontSize: 12,
  },

  /* Location */
  locationWrap: {
    marginTop: 6,
    marginBottom: 12,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },
  locationLabel: {
    color: colors.textDim,
    fontSize: 12,
  },
  locLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  locLoadingText: {
    color: colors.textDim,
    fontSize: 12,
  },
  locErrorText: {
    color: ig.danger,
    fontSize: 12,
  },

  locationInner: {
    color: colors.text,
    backgroundColor: "#0f141b",
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationInputError: {
    borderColor: ig.danger,
  },
  locationNote: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 6,
  },

  /* Post button (kept solid but warm, dark-friendly) */
  postBtn: {
    alignSelf: "flex-end",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 3 },
    }),
  },
  postBtnDisabled: {
    backgroundColor: "#2b2b2b",
  },
  postBtnText: {
    color: "#1b1400",
    fontWeight: "800",
  },
  postBtnTextDisabled: {
    color: "#6b7280",
  },
});
