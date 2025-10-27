// MobileScaler.js
import React from "react";
import { Platform, View } from "react-native";

const isWeb = typeof window !== "undefined" && typeof document !== "undefined";
export default function MobileScaler({
  baseWidth = 390,
  baseHeight = 844,
  bezel = 16,      // outer margin around the phone canvas
  bg = "#0b0b0b",  // page background
  children,
}) {
  if (!isWeb) return <>{children}</>; // native: render as-is

  const [vw, setVw] = React.useState(window.innerWidth);
  const [vh, setVh] = React.useState(window.innerHeight);

  React.useEffect(() => {
    const onResize = () => {
      setVw(window.innerWidth);
      setVh(window.innerHeight);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const scale = Math.min(
    (vw - bezel * 2) / baseWidth,
    (vh - bezel * 2) / baseHeight
  );

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        background: bg,
        display: "grid",
        placeItems: "center",
        overflow: "hidden",
      }}
    >
      {/* “phone” frame */}
      <div
        style={{
          width: baseWidth,
          height: baseHeight,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
          borderRadius: 28,
          boxShadow:
            "0 8px 24px rgba(0,0,0,.5), 0 2px 8px rgba(0,0,0,.35)",
          background: "#111",   // matches your app bg
          overflow: "hidden",   // clip rounded corners
        }}
      >
        {/* React Native content mounts here */}
        <View style={{ width: baseWidth, height: baseHeight }}>
          {children}
        </View>
      </div>
    </div>
  );
}
