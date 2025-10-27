import { StyleSheet, Platform } from "react-native";

export const colors = {
  bg: "#0B0F14",          // app background
  panel: "#121821",       // cards/panels
  panelBorder: "#1F2937", // subtle border
  text: "#E5E7EB",        // primary text
  textDim: "#9CA3AF",     // secondary text
  brand: "#60A5FA",       // blue
  accent: "#FBBF24",      // amber (active/confirm)
  btnBg: "#1F2937",       // inactive button
};

const radius = 14;

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
    backgroundColor: "#1a1300",
    borderColor: colors.accent,
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
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
  bannerText: {
    color: colors.accent,
    fontWeight: "700",
    marginLeft: 8,
  },

  /* Title */
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 2,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 8,
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

  previewWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.panelBorder,
    overflow: "hidden",
    backgroundColor: "#0f141b",
    height: 240,
    marginBottom: 12,
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
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.btnBg,
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  actionBtnText: {
    color: colors.text,
    fontWeight: "600",
    marginLeft: 6,
  },
  actionBtnGhost: {
    flexDirection: "row",
    alignItems: "center",
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: "transparent",
  },
  actionBtnGhostText: {
    color: colors.textDim,
    fontWeight: "600",
    marginLeft: 6,
  },

  captionWrap: {
    marginTop: 4,
    marginBottom: 12,
  },
  captionLabel: {
    color: colors.textDim,
    marginBottom: 6,
    fontSize: 12,
  },
  captionInput: {
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
    color: "#f87171",
    fontSize: 12,
  },
  locationInput: {
    color: colors.text,
    backgroundColor: "#0f141b",
    borderColor: colors.panelBorder,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  locationInputError: {
    borderColor: "#f87171",
  },
  locationNote: {
    color: colors.textDim,
    fontSize: 12,
    marginTop: 6,
  },

  /* Post button */
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
        shadowOpacity: 0.4,
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
