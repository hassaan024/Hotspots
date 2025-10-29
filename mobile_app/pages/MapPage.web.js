// pages/MapPage.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image as RNImage, ActivityIndicator, Modal, TouchableOpacity, Image } from "react-native";
import { styles } from "../styles";
import { listLocations, API_BASE } from "../components/api";
import { loadGoogleMaps } from "../utils/googleMapsLoader";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = "e2597d7067e6b124501ac533";
const DENSITY_THRESHOLD = 3;
const CLUSTER_RADIUS_M = 100; // show heatmap when >= this many posts are visible
const ZOOM_THRESHOLD = 10;

const CROWD_HIDE_MAX_ZOOM = 13;


const Uluru = { lat: -25.344, lng: 131.031 };
const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

const isImagePath = (s = "") => /\.(jpe?g|png|webp|gif)$/i.test(s);
const isVideoPath = (s = "") => /\.(mp4|mov|webm|ogg|ogv|3gp)$/i.test(s);

// Build a usable image URL from a post's datapath (mirrors PostsPage logic)
function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  const clean = String(datapath).replace(/^\.?\//, "");
  return `${API_BASE}/uploads/${clean}`;
}

// pick the preview asset
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

function haversineMeters(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

function groupPointsByRadius(points, radiusM = 25) {
  const groups = [];
  for (const p of points) {
    if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) continue;
    let placed = false;
    for (const g of groups) {
      // quick proximity check to the group's representative center
      const d = haversineMeters(g.lat, g.lng, p.lat, p.lng);
      if (d <= radiusM) {
        g.items.push(p);
        // update centroid
        const n = g.items.length;
        g.lat = g.items.reduce((acc, it) => acc + it.lat, 0) / n;
        g.lng = g.items.reduce((acc, it) => acc + it.lng, 0) / n;
        placed = true;
        break;
      }
    }
    if (!placed) {
      groups.push({ lat: p.lat, lng: p.lng, items: [p] });
    }
  }
  return groups;
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

<<<<<<< Updated upstream
=======
function injectNoControlsCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("no-media-controls")) return;
  const style = document.createElement("style");
  style.id = "no-media-controls";
  style.textContent = `
    video::-webkit-media-controls-enclosure { display: none !important; }
    video::-webkit-media-controls { display: none !important; }
  `;
  document.head.appendChild(style);
}

// --- One-time audio unlock for web autoplay with sound ---
let HOTSPOTS_AUDIO_UNLOCKED = false;

function installAudioUnlockOnce() {
  if (HOTSPOTS_AUDIO_UNLOCKED) return;

  const unlock = () => {
    HOTSPOTS_AUDIO_UNLOCKED = true;
    // Unmute any already rendered videos and try to play them
    const vids = document.querySelectorAll('video[data-hotspots-video]');
    vids.forEach((v) => {
      try {
        v.muted = false;
        const p = v.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      } catch {}
    });
    window.removeEventListener("pointerdown", unlock, true);
    window.removeEventListener("keydown", unlock, true);
  };

  window.addEventListener("pointerdown", unlock, true);
  window.addEventListener("keydown", unlock, true);
}
// --- end audio unlock ---

>>>>>>> Stashed changes
export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapRef = useRef(null);
  const markersRef = useRef([]);
  const galleryRef = useRef(null);
  const infoWindowRef = useRef(null);
  const [error, setError] = useState(null);
  const [loadingMaps, setLoadingMaps] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupIndex, setGroupIndex] = useState(0);

  useEffect(() => {
    installAudioUnlockOnce();
  }, []);

  useEffect(() => {
    if (selectedGroup && galleryRef.current) {
      // reset to the first slide when opening
      try { galleryRef.current.scrollLeft = 0; } catch {}
      setGroupIndex(0);
    }
  }, [selectedGroup]);

  function pickMostRecent(items = []) {
    if (!Array.isArray(items) || items.length === 0) return null;
    const keyCandidates = ["created_at","createdAt","timestamp","time","postid","id"];
    const score = (it) => {
      for (const k of keyCandidates) {
        const v = it?.[k];
        if (v == null) continue;
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
        const t = new Date(v).getTime();
        if (!Number.isNaN(t)) return t;
      }
      return -Infinity;
    };
    return [...items].sort((a,b) => score(b) - score(a))[0] || items[0];
  }

  function openGroupMiniFeed(map, position, items) {
    try { infoWindowRef.current?.close?.(); } catch {}

    const root = document.createElement("div");
    root.style.maxWidth = "420px";
    root.style.width = "88vw";
    root.style.background = "#0b0b0f";
    root.style.border = "1px solid #2a2a2a";
    root.style.borderRadius = "12px";
    root.style.overflow = "hidden";
    root.style.color = "#fff";
    root.style.boxShadow = "0 8px 24px rgba(0,0,0,.45)";

    const header = document.createElement("div");
    header.textContent = `${items.length} posts here`;
    header.style.font = "600 14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    header.style.padding = "10px 12px";
    header.style.borderBottom = "1px solid #222";
    root.appendChild(header);

    const scroller = document.createElement("div");
    scroller.style.display = "flex";
    scroller.style.gap = "8px";
    scroller.style.overflowX = "auto";
    scroller.style.scrollSnapType = "x proximity";
    scroller.style.padding = "12px";
    scroller.style.maxHeight = "380px";
    scroller.style.alignItems = "stretch";
    scroller.style.scrollBehavior = "smooth";
    root.appendChild(scroller);

    items.forEach((it, idx) => {
      const isVid = Number(it?.posttype) === 1 || /\.(mp4|mov|webm|ogg|ogv|3gp)$/i.test(String(it?.datapath || ""));
      const thumbOrImg = isVid ? toImageUri(it.thumbpath) : toImageUri(it.datapath);

      const card = document.createElement("div");
      card.style.minWidth = "220px";
      card.style.width = "220px";
      card.style.scrollSnapAlign = "start";
      card.style.background = "#111";
      card.style.border = "1px solid #222";
      card.style.borderRadius = "10px";
      card.style.overflow = "hidden";
      card.style.cursor = "pointer";
      card.style.display = "flex";
      card.style.flexDirection = "column";
      card.style.userSelect = "none";

      const mediaWrap = document.createElement("div");
      mediaWrap.style.width = "100%";
      mediaWrap.style.height = "280px";
      mediaWrap.style.background = "#000";
      mediaWrap.style.display = "flex";
      mediaWrap.style.alignItems = "center";
      mediaWrap.style.justifyContent = "center";
      mediaWrap.style.overflow = "hidden";

      const img = document.createElement("img");
      img.src = thumbOrImg || `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="280"><rect width="100%" height="100%" fill="#222"/></svg>')}`;
      img.alt = it.postedby ? `@${it.postedby}` : "post";
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      mediaWrap.appendChild(img);

      const meta = document.createElement("div");
      meta.style.padding = "8px 10px";
      meta.style.borderTop = "1px solid #222";
      meta.style.display = "flex";
      meta.style.flexDirection = "column";
      meta.style.gap = "2px";

      const user = document.createElement("div");
      user.textContent = it.postedby ? `@${it.postedby}` : "Unknown";
      user.style.font = "600 13px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      user.style.color = "#fff";

      const cap = document.createElement("div");
      cap.textContent = String(it?.caption || "").trim() || "(no caption)";
      cap.style.font = "400 12px system-ui, -apple-system, Segoe UI, Roboto, Arial";
      cap.style.color = "#bbb";
      cap.style.whiteSpace = "nowrap";
      cap.style.overflow = "hidden";
      cap.style.textOverflow = "ellipsis";

      meta.appendChild(user);
      meta.appendChild(cap);

      card.appendChild(mediaWrap);
      card.appendChild(meta);

      card.addEventListener("click", () => {
        try { infoWindowRef.current?.close?.(); } catch {}
        setSelectedPost(it);
      });

      scroller.appendChild(card);
    });

    const iw = new google.maps.InfoWindow({
      content: root,
      ariaLabel: "Posts here",
      maxWidth: 440
    });
    iw.open({ map, position });
    infoWindowRef.current = iw;
  }

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

        // group points first so heatmap reflects combined posts at same spot
        const groups = groupPointsByRadius(points, 25);

        // build weighted heatmap data, weight is number of posts in the group
        const heatData = groups.map((g) => ({
          location: new google.maps.LatLng(g.lat, g.lng),
          weight: g.items.length,
        }));

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
          map: null, // start hidden; we will toggle based on viewport density
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

        // Group points before making markers (already computed as `groups` above)
        const markers = groups.map((g) => {
          const mostRecent = pickMostRecent(g.items) || g.items[0] || {};
          const preview = pickPreviewAsset(mostRecent);
          const url = toImageUri(preview);
          const img = document.createElement("div");
          img.style.position = "relative";
          img.style.width = "38px";
          img.style.height = "54px";
          img.style.boxShadow = "0 0 0 2px #0b0b0f, 0 2px 6px rgba(0,0,0,.4)";
          img.style.borderRadius = "4px";
          img.style.overflow = "hidden";
          const inner = document.createElement("img");
          inner.src = url || `data:image/svg+xml;utf8,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="38" height="54"><rect width="100%" height="100%" fill="#222"/></svg>')}`;
          inner.alt = mostRecent.postedby ? `@${mostRecent.postedby}` : "post";
          inner.style.width = "100%";
          inner.style.height = "100%";
          inner.style.objectFit = "cover";
          img.appendChild(inner);
          if (g.items.length > 1) {
            const badge = document.createElement("div");
            badge.textContent = String(g.items.length);
            badge.style.position = "absolute";
            badge.style.right = "4px";
            badge.style.top = "4px";
            badge.style.background = "rgba(0,0,0,0.7)";
            badge.style.color = "#fff";
            badge.style.fontSize = "12px";
            badge.style.padding = "2px 6px";
            badge.style.borderRadius = "12px";
            badge.style.lineHeight = "1";
            img.appendChild(badge);
          }
          const mk = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: g.lat, lng: g.lng },
            content: img,
            title: g.items.length > 1 ? `${g.items.length} posts here` : `@${mostRecent.postedby || ""}`,
          });
          const open = () => {
            if (g.items.length > 1) {
              openGroupMiniFeed(map, { lat: g.lat, lng: g.lng }, g.items);
            } else if (g.items.length === 1) {
              setSelectedPost(g.items[0]);
            }
          };
          if (mk.addListener) mk.addListener("gmp-click", open);
          img.addEventListener("click", open);
          return mk;
        });

        markersRef.current = markers;

const DLV_MAP = map; // use the in-scope map instance for visibility logic
function updateLayerVisibility() {
  const b = DLV_MAP.getBounds();
  if (!b) return;

  const visible = points.filter((p) =>
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    b.contains(new google.maps.LatLng(p.lat, p.lng))
  );

  let crowded = false;
  for (let i = 0; i < visible.length && !crowded; i++) {
    let count = 1;
    const a = visible[i];
    for (let j = i + 1; j < visible.length; j++) {
      const d = haversineMeters(a.lat, a.lng, visible[j].lat, visible[j].lng);
      if (d <= CLUSTER_RADIUS_M) {
        count++;
        if (count >= DENSITY_THRESHOLD) {
          crowded = true;
          break;
        }
      }
    }
  }

  const zoomLevel = DLV_MAP.getZoom() || 0;
  const hideMarkers = (crowded && zoomLevel < CROWD_HIDE_MAX_ZOOM) || zoomLevel < ZOOM_THRESHOLD;

  if (heatmapRef.current) heatmapRef.current.setMap(hideMarkers ? DLV_MAP : null);

  if (markersRef.current && markersRef.current.length) {
    for (const m of markersRef.current) m.setMap(hideMarkers ? null : DLV_MAP);
  }
}

// initial apply and on viewport changes
updateLayerVisibility();
const idleListener = DLV_MAP.addListener("idle", updateLayerVisibility);

      } catch (e) {
        console.error(e);
        setError("Failed to load map or locations");
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (typeof idleListener !== "undefined" && idleListener) {
          google.maps.event.removeListener(idleListener);
        }
      } catch {}
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      if (markersRef.current && markersRef.current.length) {
        for (const m of markersRef.current) m.setMap(null);
        markersRef.current = [];
      }
      try { infoWindowRef.current?.close?.(); } catch {}
      infoWindowRef.current = null;
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
                  { (Number(selectedPost?.posttype) === 1 || isVideoPath(String(selectedPost?.datapath || ""))) ? (
                    <video
                      key={String(selectedPost?.postid || selectedPost?.id || selectedPost?.datapath)}
                      src={toImageUri(selectedPost.datapath)}
                      poster={toImageUri(selectedPost.thumbpath)}
                      controls
                      playsInline
                      autoPlay
                      muted={!HOTSPOTS_AUDIO_UNLOCKED}
                      loop
<<<<<<< Updated upstream
                      preload="metadata"
=======
                      controls={false}
                      controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      data-hotspots-video
                      onLoadedMetadata={(e) => {
                        if (HOTSPOTS_AUDIO_UNLOCKED) {
                          try {
                            e.currentTarget.muted = false;
                            const p = e.currentTarget.play();
                            if (p && typeof p.catch === "function") p.catch(() => {});
                          } catch {}
                        }
                      }}
                      onCanPlay={(e) => {
                        try {
                          if (HOTSPOTS_AUDIO_UNLOCKED) e.currentTarget.muted = false;
                          const p = e.currentTarget.play();
                          if (p && typeof p.catch === "function") p.catch(() => {});
                        } catch {}
                      }}
                      onClick={(e) => {
                        const v = e.currentTarget;
                        v.muted = !v.muted;
                        try {
                          const p = v.play();
                          if (p && typeof p.catch === "function") p.catch(() => {});
                        } catch {}
                      }}
>>>>>>> Stashed changes
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 10,
                        display: "block",
                        maxHeight: 750,
                        objectFit: "contain"
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
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
                  )}
                </View>
                <Text style={[styles.username, { marginTop: 12, marginBottom: 8 }]}>
                   {selectedPost.postedby || "Unknown"}
                </Text>
                <Text style={[styles.text, { marginBottom: 8 }]}>
                  {String(selectedPost?.caption || "").trim() || "(no caption)"}
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
      {selectedGroup && Array.isArray(selectedGroup) && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedGroup(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setSelectedGroup(null)}
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
                width: "92%",
                maxWidth: 440,
                alignItems: "stretch",
              }}
            >
              <View style={styles.postWrapper}>
                <View style={[styles.postBox, { paddingBottom: 0 }]}>
                  <View
                    style={{
                      width: "100%",
                      height: 520,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      ref={galleryRef}
                      onScroll={(e) => {
                        const el = e.currentTarget;
                        const idx = Math.round(el.scrollLeft / el.clientWidth);
                        if (idx !== groupIndex) setGroupIndex(idx);
                      }}
                      style={{
                        display: "flex",
                        flexDirection: "row",
                        width: "100%",
                        height: "100%",
                        overflowX: "auto",
                        scrollSnapType: "x mandatory",
                        WebkitOverflowScrolling: "touch",
                        scrollBehavior: "smooth",
                        gap: "0px",
                      }}
                      tabIndex={0}
                    >
                      {selectedGroup.map((it, idx) => {
                        const isVid = Number(it?.posttype) === 1 || isVideoPath(String(it?.datapath || ""));
                        const src = toImageUri(it.datapath);
                        const poster = toImageUri(it.thumbpath);
                        return (
                          <div
                            key={String(it.postid || it.id || idx)}
                            style={{
                              minWidth: "100%",
                              height: "100%",
                              scrollSnapAlign: "center",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#000",
                            }}
                            onFocus={() => setGroupIndex(idx)}
                          >
                            {isVid ? (
                              <video
                                src={src}
                                poster={poster}
                                playsInline
                                autoPlay
                                muted={!HOTSPOTS_AUDIO_UNLOCKED}
                                loop
                                controls={false}
                                controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                                disablePictureInPicture
                                onContextMenu={(e) => e.preventDefault()}
                                data-hotspots-video
                                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
                                onLoadedMetadata={(e) => {
                                  if (HOTSPOTS_AUDIO_UNLOCKED) {
                                    try {
                                      e.currentTarget.muted = false;
                                      const p = e.currentTarget.play();
                                      if (p && typeof p.catch === "function") p.catch(() => {});
                                    } catch {}
                                  }
                                }}
                                onCanPlay={(e) => {
                                  try {
                                    if (HOTSPOTS_AUDIO_UNLOCKED) e.currentTarget.muted = false;
                                    const p = e.currentTarget.play();
                                    if (p && typeof p.catch === "function") p.catch(() => {});
                                  } catch {}
                                }}
                                onClick={(e) => {
                                  const v = e.currentTarget;
                                  v.muted = !v.muted;
                                  try {
                                    const p = v.play();
                                    if (p && typeof p.catch === "function") p.catch(() => {});
                                  } catch {}
                                }}
                              />
                            ) : (
                              <Image
                                source={{ uri: src }}
                                style={{ width: "100%", height: "100%", resizeMode: "contain" }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </View>
                </View>
                <Text style={[styles.username, { marginTop: 12, marginBottom: 4 }]}>
                  {selectedGroup[groupIndex]?.postedby || "Unknown"}
                </Text>
                <Text style={[styles.text, { marginBottom: 8 }]}>
                  {String(selectedGroup[groupIndex]?.caption || "").trim() || "(no caption)"}
                </Text>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}