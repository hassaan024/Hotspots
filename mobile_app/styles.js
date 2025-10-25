import { StyleSheet } from "react-native";


const colors = {
  bg: "#0B0F14",          // app background
  panel: "#121821",       // cards/panels
  panelBorder: "#1F2937", // subtle border
  text: "#E5E7EB",        // primary text
  textDim: "#9CA3AF",     // secondary text
  brand: "#60A5FA",       // blue
  accent: "#FBBF24",      // amber (active button)
  btnBg: "#1F2937",       // inactive button
};

export const styles = StyleSheet.create({
  app: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  /* Navbar (bottom) */
  navbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.panel,
    borderTopWidth: 1,
    borderTopColor: colors.panelBorder,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
    elevation: 6,
  },
  brand: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.brand,
  },
  navButtons: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.btnBg,
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#1F2937",
  },
  navBtnActive: {
    backgroundColor: "#2a2a1f",
    borderColor: "#FBBF24",
    borderWidth: 1,
    shadowColor: "#FBBF24",
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  navBtnText: {
    color: colors.text,
    fontWeight: "600",
  },
  navBtnTextActive: {
    color: "#111827",
    fontWeight: "700",
  },

  /* Content (reserve space for navbar) */
  content: {
    flex: 1,
    padding: 16,
    marginBottom: 64,
  },

  /* Pages */
  screen: {
    flex: 1,
    backgroundColor: colors.panel,
    borderRadius: 14,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.panelBorder,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  screenSub: {
    color: colors.textDim,
  },
  /* Map */
  mapWrapper: {
    position: "relative",
  },
  mapContainer: {
    flex: 1,
    minHeight: 500,
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  mapLoadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
  },
  mapLoadingText: {
    color: "#fff",
    marginTop: 12,
  },
  //everything below this is for the posts
    postWrapper: {
      width : "100%",
      backgroundColor:colors.panelBorder,
      padding: 16,
    },
    postBox: {
      backgroundColor: colors.panel,
      borderRadius: 32,
      marginVertical: 10,
      overflow: "hidden",
      
    },
    username: {
      color: "#fff",
      fontWeight: "bold",
      marginBottom: 5,
      marginLeft: 5,
    },
    text: {
      color: "#fff",
      marginLeft: 5,
    },
    boldUsername: {
      fontWeight: "bold",
      color: "#fff",
    },
    image: {
      width: '100%',
      height: 750,
      resizeMode: 'cover',
    },
});
