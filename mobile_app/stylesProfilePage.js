import { StyleSheet, Platform } from "react-native";

export const colors = {
  bg: "#120206",          // app background
  panel: "#1F021B",       // cards/panels
  panelBorder: "#4A2F40", // subtle border
  text: "#E5E7EB",        // primary text
  textDim: "#9CA3AF",     // secondary text
  brand: "#60A5FA",       // blue
  accent: "#FBBF24",      // amber (active button)
  btnBg: "#61074E",       // inactive button
};

const cardRadius = 14;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingTop: 12,
  },

  /* ===== Header Card ===== */
  headerCard: {
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: cardRadius,
    padding: 14,
    marginBottom: 12,
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    marginRight: 18,
    backgroundColor: "#0f141b",
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  headerStats: {
    flexDirection: "row",
    flex: 1,
    justifyContent: "space-around",
    paddingHorizontal: 6,
  },
  statBlock: {
    alignItems: "center",
    minWidth: 70,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.text,
    fontFamily:
      Platform.OS === "ios" ? "AvenirNext-DemiBold" : "sans-serif-medium",
  },
  statLabel: {
    fontSize: 14,
    color: colors.textDim,
    marginTop: 6,
    letterSpacing: 0.5,
    fontFamily: Platform.OS === "ios" ? "AvenirNext-Regular" : "sans-serif",
  },
  nameRow: {
    marginTop: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  // logout button (already themed)
  logoutBtn: {
    alignSelf: "stretch",
    backgroundColor: "#151b24",
    borderColor: colors.accent,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: colors.accent,
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  logoutBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.accent,
    letterSpacing: 0.3,
  },

  /* ===== Grid Card ===== */
  gridCard: {
    flex: 1,
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: cardRadius,
    padding: 6,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.2,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  gridContainer: {
    paddingTop: 2,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    backgroundColor: "#0f141b",
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },

  divider: {
    height: 1,
    backgroundColor: colors.panelBorder,
    marginTop: 12,
  },
  viewerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  
  // Blur sits at the very back
  viewerBlur: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  
  // Close button ABOVE blur & image
  viewerCloseBtn: {
    position: "absolute",
    top: 24,
    right: 16,
    zIndex: 3, // higher than card/actions
    height: 40,
    width: 40,
    borderRadius: 20,
    backgroundColor: "rgba(17,17,17,0.6)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  
  // Image card ABOVE blur (zIndex 1)
  viewerCard: {
    zIndex: 1,
    maxWidth: "80%",
    maxHeight: "80%",
    margin: "auto 0",
    backgroundColor: colors.panel,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 10 },
      },
      android: { elevation: 6 },
    }),
  },
  
  // Make image fit the box (no cropping)
  viewerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  
  viewerLoading: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  
  // Actions ABOVE blur & card (zIndex 2)
  viewerActions: {
    position: "absolute",
    bottom: 28,
    alignSelf: "center",
    flexDirection: "row",
    gap: 18,
    backgroundColor: "rgba(18,24,33,0.75)",
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    zIndex: 2,
  },
  viewerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },  
});
