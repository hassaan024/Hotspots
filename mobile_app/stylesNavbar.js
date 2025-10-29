// stylesNavbar.js
import { StyleSheet, Platform } from "react-native";

export const ig = {
  gradient: ["#FFD600", "#FF7A00", "#FF0069", "#D300C5", "#7638FA"],
  bgDark: "#0B0A0E",
  panel: "#121018",
};

export const styles = StyleSheet.create({
  navbarWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },

  // Gradient border container
  navbarGradient: {
    height: 2, // thickness of gradient line
  },

  navbar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: ig.panel,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 8,
  },

  navBtn: {
    padding: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
