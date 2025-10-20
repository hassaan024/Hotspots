import { StyleSheet, Platform } from "react-native";

export const colors = {
  bg: "#0B0F14",          // app background
  panel: "#121821",       // cards/panels
  panelBorder: "#1F2937", // subtle border
  text: "#E5E7EB",        // primary text
  textDim: "#9CA3AF",     // secondary text
  brand: "#60A5FA",       // blue
  accent: "#FBBF24",      // amber (active button)
  btnBg: "#1F2937",       // inactive button
};

const cardRadius = 14;

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 12,
    paddingTop: 12,
  },

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

  /* Header */
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

  /* Name */
  nameRow: {
    marginTop: 12,
  },
  username: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },

  editBtn: {
    alignSelf: "stretch",
    backgroundColor: colors.btnBg,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  editBtnText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },

  // New logout button
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

  /* post grid */
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
});
