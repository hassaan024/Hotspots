import { StyleSheet, Platform } from "react-native";

export const insta = {
  bg: "rgba(12,12,16,0.75)",
  panelStroke: "rgba(255,255,255,0.06)",
  dim: "#9aa0a6",
  // Instagram gradient set
  gradientColors: ["#FFD600", "#FF7A00", "#FF0069", "#D300C5", "#7638FA"],
  // Fainter ring for inactive state
  gradientColorsFaint: ["#FFD60020", "#FF7A0020", "#FF006920", "#D300C520", "#7638FA20"],
};

export const styles = StyleSheet.create({
  navbarWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 30,
    height: 76,
  },
  blur: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: insta.bg,
    borderTopWidth: 1,
    borderTopColor: insta.panelStroke,
  },

  navbar: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.28,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: -3 },
      },
      android: { elevation: 10 },
    }),
  },

  navButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },

  // Gradient outline ring (no solid fill)
  ring: {
    width: 52,
    height: 52,
    borderRadius: 16,
    padding: 2, // ring thickness
    justifyContent: "center",
    alignItems: "center",
    // soft glow
    ...Platform.select({
      ios: {
        shadowColor: "#FF7A00",
        shadowOpacity: 0.18,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },
  ringActive: {
    padding: 2, // keep same thickness but brighter colors from gradientColors
    ...Platform.select({
      ios: {
        shadowColor: "#FF7A00",
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 4 },
    }),
  },
  ringInner: {
    width: "100%",
    height: "100%",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(22,22,28,0.9)",
    borderWidth: 1,
    borderColor: insta.panelStroke,
  },
});
