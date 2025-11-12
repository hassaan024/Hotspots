// StylesSearchUser.js
import { StyleSheet, Platform } from "react-native";

export const ig = {
  borderGradientSoft: ["#8c47b9", "#3a2d5e", "#2c2548"],
  borderGradientBright: ["#F58529", "#DD2A7B", "#8134AF", "#515BD4"],
  buttonGradientIG: ["#F58529", "#DD2A7B", "#8134AF", "#515BD4"],
};

export const colors = {
  bg: "#121018",
  text: "#F5F6F8",
  textDim: "#B6BAC4",
  line: "rgba(255,255,255,0.08)",
};

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 10,
  },

  /** ===== Search Bar ===== */
  searchOuter: { borderRadius: 16, marginBottom: 12 },
  searchBorder: { borderRadius: 16, padding: 1.5 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,13,22,0.9)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    paddingVertical: 6,
  },

  /** ===== User Cards ===== */
  frameOuter: {
    borderRadius: 18,
    marginBottom: 12,
  },
  frameGradient: {
    borderRadius: 18,
    padding: 1.2,
  },
  card: {
    borderRadius: 16,
    backgroundColor: "rgba(20,18,25,0.88)",
    padding: 12,
    borderColor: colors.line,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 999,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 999,
    resizeMode: "cover",
  },

  cardCenter: { flex: 1 },

  usernameBig: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  meta: {
    color: colors.textDim,
    fontSize: 12.5,
  },
  metaStrong: {
    color: colors.text,
    fontWeight: "800",
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.3)",
    marginHorizontal: 8,
  },

  /** ===== View Profile Button ===== */
  profileBtn: { marginLeft: 10 },
  profileBtnBg: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  profileBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13.5,
    letterSpacing: 0.2,
  },

  /** ===== Empty State ===== */
  emptyState: {
    marginTop: 48,
    alignItems: "center",
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: "900",
    fontSize: 18,
    marginTop: 10,
  },
  emptyText: {
    color: colors.textDim,
    fontSize: 13.5,
    marginTop: 6,
    textAlign: "center",
  },
  queryEm: { color: colors.text, fontWeight: "800" },
});
