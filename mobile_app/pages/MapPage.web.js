// pages/MapPage.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image as RNImage, ActivityIndicator, Modal, TouchableOpacity, Image } from "react-native";
import { styles } from "../styles";
import { listLocations, API_BASE } from "../components/api";
import { loadGoogleMaps } from "../utils/googleMapsLoader";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = "e2597d7067e6b124501ac533";

// Build a usable image URL from a post's datapath (mirrors PostsPage logic)


const Uluru = { lat: -25.344, lng: 131.031 };
const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

const isImagePath = (s = "") => /\.(jpe?g|png|webp|gif)$/i.test(s);
const isVideoPath = (s = "") => /\.(mp4|mov|webm|ogg|ogv|3gp)$/i.test(s);

// same URL builder you use elsewhere
function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  const clean = String(datapath).replace(/^\.?\//, "");
  return `${API_BASE}/uploads/${clean}`;
}

// pick the preview asset like PostsPage logic:
// - if it's a video => use thumbpath (fallback to null so we don't try to <img> a .mp4)
// - if it's an image => use datapath
function pickPreviewAsset(p) {
  const posttype = Number(p?.posttype);
  const dp = String(p?.datapath || "");
  const tp = String(p?.thumbpath || "");

  if (posttype === 1 || /\.(mp4|mov|webm|ogg|ogv|3gp)$/i.test(dp)) {
    return tp || null; // video => use thumbnail or nothing (fallback to placeholder)
  }
  return dp || null;   // image => use image path
}

/* function loadGoogle() {
  // Resolve as soon as the Maps namespace exists (older loaders may not have importLibrary)
  if (window.google?.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-gmaps="1"]');
    if (!script) {
      script = document.createElement("script");
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${API_KEY}` +
        `&v=weekly&libraries=marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.dataset.gmaps = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
  });
} */

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapRef = useRef(null);
  const markersRef = useRef([]);
  const [error, setError] = useState(null);
  const [loadingMaps, setLoadingMaps] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!API_KEY) {
          setError("Missing API KEY");
          return;
        }
        if (typeof window === "undefined") return;

        const points = await listLocations(); // [{ id, postedby, lat, lng, datapath }]

        await loadGoogleMaps();
        if (cancelled || !mapRef.current) return;
        // hide loading screen as soon as Google Maps JS is ready
        setLoadingMaps(false);

        // Work with or without importLibrary (older/newer loaders)
        const { Map, InfoWindow } = google.maps;
        let AdvancedMarkerElement =
          google.maps.marker && google.maps.marker.AdvancedMarkerElement
            ? google.maps.marker.AdvancedMarkerElement
            : null;

        if (!AdvancedMarkerElement && google.maps.importLibrary) {
          const markerLib = await google.maps.importLibrary("marker");
          AdvancedMarkerElement = markerLib.AdvancedMarkerElement;
        }

        if (!Map || !InfoWindow || !AdvancedMarkerElement) {
          throw new Error("Google Maps libraries not ready");
        }

        const { ColorScheme } = await google.maps.importLibrary("core");
        const map = new Map(mapRef.current, {
          center: Uluru,
          zoom: 6,
          mapId: MAP_ID,
          gestureHandling: "greedy",
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          mapTypeControl: false,
          colorScheme: ColorScheme.DARK,
        });

        mapInstanceRef.current = map;

        // Clear any prior markers
        markersRef.current = [];

        // make sure the visualization lib is present, with or without importLibrary
        let HeatmapLayer = google.maps.visualization?.HeatmapLayer;
        if (!HeatmapLayer && google.maps.importLibrary) {
          const viz = await google.maps.importLibrary("visualization");
          HeatmapLayer = viz.HeatmapLayer;
        }
        if (!HeatmapLayer) throw new Error("Heatmap library not available");

        // convert your points into LatLng
        const heatData = points
          .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
          .map((p) => new google.maps.LatLng(p.lat, p.lng));

        // custom gradient that reads well on dark maps
        const gradient = [
          "rgba(0, 0, 0, 0)",
          "rgba(0, 120, 255, 0.4)",
          "rgba(0, 180, 255, 0.6)",
          "rgba(0, 255, 200, 0.7)",
          "rgba(120, 255, 120, 0.8)",
          "rgba(255, 230, 0, 0.9)",
          "rgba(255, 140, 0, 0.95)",
          "rgba(255, 0, 0, 1.0)",
        ];

        // create the heatmap (we will toggle visibility based on viewport density)
        const heatmap = new HeatmapLayer({
          data: heatData,
          map, // start visible; updateLayerVisibility will switch as needed
          dissipating: true,
          radius: 28,
          opacity: 0.6,
          gradient,
        });
        heatmapRef.current = heatmap;

        // Try to get and show user's location
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const user = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              map.setCenter(user);
              map.setZoom(15);
              // Use a local asset for the user icon; resolve to a web-served URI via RN Image
              let userIconUri = null;
              try {
                userIconUri = RNImage.resolveAssetSource(require("../assets/userIcon.png")).uri;
              } catch (_e) {
                userIconUri = null; // fallback below if resolution fails
              }

              const userImg = document.createElement("img");
              userImg.src =
                userIconUri ||
                "data:image/svg+xml;utf8," +
                  encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44"><defs><radialGradient id="g" cx="50%" cy="40%" r="60%"><stop offset="0%" stop-color="#ffd166"/><stop offset="100%" stop-color="#fca311"/></radialGradient></defs><circle cx="22" cy="22" r="22" fill="url(#g)"/><circle cx="22" cy="18" r="7" fill="#0b0b0f"/><path d="M8 36c3-7 10-10 14-10s11 3 14 10" fill="#0b0b0f"/></svg>'
                  );
              userImg.alt = "You are here";
              userImg.style.width = "44px";
              userImg.style.height = "44px";
              userImg.style.objectFit = "cover";
              userImg.style.borderRadius = "50%";
              userImg.style.boxShadow = "0 0 0 2px #0b0b0f, 0 2px 6px rgba(0,0,0,.45)";

              new AdvancedMarkerElement({ map, position: user, content: userImg, title: "You are here" });
            },
            () => {},
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );
        }

        // Create image-backed markers using AdvancedMarkerElement content
        const placeholder = `data:image/svg+xml;utf8,${encodeURIComponent(
          '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="100%" height="100%" rx="20" ry="20" fill="#222"/><text x="50%" y="56%" fill="#ffd166" font-size="18" text-anchor="middle" font-family="Inter, Arial">H</text></svg>'
        )}`;

 const markers = points.map((p) => {
   const img = document.createElement("img");
   const preview = pickPreviewAsset(p); // thumb for video; datapath for image
   const url = toImageUri(preview);
 if (!url) {
   console.warn("No preview URL for point", p);
 } else {
   // Optional: test the URL in a new tab to confirm it loads
   // console.log("Marker img URL:", url);
 }
   img.src = url || placeholder;
   img.alt = p.postedby ? `@${p.postedby}` : "post";
   img.style.width = "40px";
   img.style.height = "40px";
   img.style.objectFit = "cover";
   img.style.borderRadius = "50%";
   img.style.boxShadow = "0 0 0 2px #0b0b0f, 0 2px 6px rgba(0,0,0,.4)";
   img.loading = "lazy";
   // if the image fails (e.g., no thumb yet / wrong filename), show placeholder
   img.onerror = () => { img.src = placeholder; };

   return new google.maps.marker.AdvancedMarkerElement({
     map,
     position: { lat: p.lat, lng: p.lng },
     content: img,
     title: `@${p.postedby}`,
   });
 });

        new MarkerClusterer({ markers, map });
      } catch (e) {
        console.error(e);
        setError("Failed to load map or locations");
      }
    })();

    return () => {
      cancelled = true;
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      if (markersRef.current && markersRef.current.length) {
        for (const m of markersRef.current) m.setMap(null);
        markersRef.current = [];
      }
      if (mapInstanceRef.current) {
        try {
          google.maps.event.clearInstanceListeners(mapInstanceRef.current);
        } catch {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Map</Text>
      {error ? (
        <Text style={styles.screenSub}>{error}</Text>
      ) : (
        <View style={styles.mapWrapper}>
          <View ref={mapRef} style={styles.mapContainer} />
          {loadingMaps && (
            <View style={styles.mapLoadingOverlay}>
              <ActivityIndicator size="large" color="#ffffff" />
              <Text style={styles.mapLoadingText}>Loading map…</Text>
            </View>
          )}
        </View>
      )}
      {selectedPost && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedPost(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSelectedPost(null)}
            style={{
              flex: 1,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              justifyContent: "center",
              alignItems: "center",
              paddingHorizontal: 16,
            }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={{
                backgroundColor: "#000",
                borderRadius: 12,
                padding: 20,
                width: "90%",
                maxWidth: 400,
                alignItems: "center",
              }}
            >
              <View style={styles.postWrapper}>
                <View style={styles.postBox}>
                  <Image
                    source={{ uri: toImageUri(selectedPost.datapath) }}
                    style={{
                      width: "100%",
                      height: undefined,
                      aspectRatio: 1,
                      resizeMode: "cover",
                      borderRadius: 10,
                    }}
                  />
                </View>
                <Text style={[styles.username, { marginTop: 12, marginBottom: 8 }]}>
                  Posted by: {selectedPost.postedby || "Unknown"}
                </Text>
                <Text style={{ color: "#fff", fontSize: 16, marginBottom: 8 }}>
                  Latitude: {selectedPost.lat}
                </Text>
                <Text style={{ color: "#fff", fontSize: 16 }}>
                  Longitude: {selectedPost.lng}
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}