// pages/MapPage.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image as RNImage, ActivityIndicator, Modal, TouchableOpacity, Image, ScrollView, TextInput } from "react-native";
import { styles } from "../styles";
import { listLocations, API_BASE, getPostWithComments, updateLikeStatus, addComment } from "../components/api";
import { Ionicons, Feather } from "@expo/vector-icons";
import { loadGoogleMaps } from "../utils/googleMapsLoader";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = "e2597d7067e6b124501ac533";
const DENSITY_THRESHOLD = 3;
const CLUSTER_RADIUS_M = 100; // show heatmap when >= this many posts are visible
const ZOOM_THRESHOLD = 9;

const CROWD_HIDE_MAX_ZOOM = 14;


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

// Helper: pick the most recent post from a group of items
function pickMostRecent(items = []) {
  if (!Array.isArray(items) || items.length === 0) return null;
  const keyCandidates = ["created_at", "createdAt", "timestamp", "time", "postid", "id"];
  const hasKey = (obj, k) => Object.prototype.hasOwnProperty.call(obj || {}, k);
  let key = keyCandidates.find((k) => hasKey(items[0], k));
  if (!key) key = "postid";
  const getVal = (x) => {
    const v = x?.[key];
    if (v == null) return -Infinity;
    const n = Number(v);
    if (!Number.isNaN(n)) return n;
    const t = Date.parse(String(v));
    return Number.isNaN(t) ? -Infinity : t;
  };
  return items.slice().sort((a, b) => getVal(b) - getVal(a))[0] || items[0];
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

function injectNoControlsCSS() {
  if (typeof document === "undefined") return;
  if (document.getElementById("no-media-controls")) return;
  const style = document.createElement("style");
  style.id = "no-media-controls";
  style.textContent = `
    /* Hide native video controls on web */
    video::-webkit-media-controls-enclosure { display: none !important; }
    video::-webkit-media-controls { display: none !important; }

    /* Hide scrollbars for group feed scroller */
    .hotspots-scroll {
      scrollbar-width: none;          /* Firefox */
      -ms-overflow-style: none;       /* IE/Edge */
    }
    .hotspots-scroll::-webkit-scrollbar { /* Chrome/Safari */
      width: 0 !important;
      height: 0 !important;
      display: none !important;
      background: transparent !important;
    }
  `;
  document.head.appendChild(style);
}

// --- One-time audio unlock for web autoplay with sound ---
let AUDIO_ENABLED = false;

function installAudioUnlockOnce() {
  if (AUDIO_ENABLED) return;

  const unlock = () => {
    AUDIO_ENABLED = true;
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

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const heatmapRef = useRef(null);
  const markersRef = useRef([]);
  const galleryRef = useRef(null);
  const idleListenerRef = useRef(null);
  const [error, setError] = useState(null);
  const [loadingMaps, setLoadingMaps] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groupIndex, setGroupIndex] = useState(0);
  const [likedPosts, setLikedPosts] = useState({});
  const [likeCounts, setLikeCounts] = useState({});
  const [viewingPost, setViewingPost] = useState(null);
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareTargetPost, setShareTargetPost] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentSending, setCommentSending] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    installAudioUnlockOnce();
  }, []);

const toggleLike = async (postid) => {
  const prevLiked = !!likedPosts[postid];
  const nextLiked = !prevLiked;

  // optimistic
  setLikedPosts((p) => ({ ...p, [postid]: nextLiked }));
  setLikeCounts((counts) => ({
    ...counts,
    [postid]: Math.max(0, (counts[postid] || 0) + (nextLiked ? 1 : -1)),
  }));

  try {
    const res = await updateLikeStatus(postid, nextLiked);
    setLikedPosts((p) => ({ ...p, [postid]: !!res.liked }));
    setLikeCounts((counts) => ({ ...counts, [postid]: res.likeCount ?? counts[postid] }));
  } catch (e) {
    console.error(e);
    // rollback
    setLikedPosts((p) => ({ ...p, [postid]: prevLiked }));
    setLikeCounts((counts) => ({
      ...counts,
      [postid]: Math.max(0, (counts[postid] || 0) + (prevLiked ? 1 : -1)),
    }));
  }
};


  const handleComment = async (postid) => {
    try {
      setCommentsLoading(true);
      const data = await getPostWithComments(postid);
      setViewingPost(data);
    } catch (e) {
      console.error(e);
      alert("Couldn't load comments.");
    } finally {
      setCommentsLoading(false);
    }
  };

  const sendComment = async () => {
    const body = String(commentText || "").trim();
    if (!body || !viewingPost) return;
    try {
      setCommentSending(true);
      const created = await addComment(viewingPost.postid, { body });
      setViewingPost((v) => ({ ...v, comments: [...(v?.comments || []), created] }));
      setCommentText("");
    } catch (e) {
      console.error(e);
      alert("Failed to comment.");
    } finally {
      setCommentSending(false);
    }
  };

  useEffect(() => {
    if (selectedGroup && galleryRef.current) {
      // reset to the first slide when opening
      try { galleryRef.current.scrollLeft = 0; } catch {}
      setGroupIndex(0);
    }
  }, [selectedGroup]);

  useEffect(() => {
    let cancelled = false;
    injectNoControlsCSS();

    (async () => {
      try {
        if (!API_KEY) {
          setError("Missing API KEY");
          return;
        }
        if (typeof window === "undefined") return;

        const points = await listLocations(); // [{ id, postedby, lat, lng, datapath }]
        try {
          const counts = {};
          (points || []).forEach((p) => { if (p?.postid != null) counts[p.postid] = p.likeCount || 0; });
          setLikeCounts(counts);
        } catch {}

        await loadGoogleMaps();
        if (!window.google || !google.maps) {
          throw new Error("Google Maps failed to initialize");
        }
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

        let ColorScheme = undefined;
        try {
          const core = await google.maps.importLibrary("core");
          ColorScheme = core?.ColorScheme;
        } catch {}
        const map = new Map(mapRef.current, {
          center: Uluru,
          zoom: 6,
          mapId: MAP_ID,
          gestureHandling: "greedy",
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          mapTypeControl: false,
          colorScheme: ColorScheme ? ColorScheme.DARK : undefined,
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
        if (!HeatmapLayer && google.maps.visualization) {
          HeatmapLayer = google.maps.visualization.HeatmapLayer;
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
          const recent = pickMostRecent(g.items) || {};
          const preview = pickPreviewAsset(recent);
          const url = toImageUri(preview);

          // Outer wrapper, provides the gradient border like the post box
          const outer = document.createElement("div");
          outer.style.position = "relative";
          outer.style.padding = "1px"; // always show ring, even for solo posts
          outer.style.borderRadius = "6px";
          outer.style.background = "linear-gradient(90deg,#FFD600,#FF7A00,#FF0069,#D300C5,#7638FA)";
          outer.style.outline = "none";

          // Inner container, holds the actual media and shadow
          const frame = document.createElement("div");
          frame.style.width = "38px";
          frame.style.height = "54px";
          frame.style.borderRadius = "5px";
          frame.style.overflow = "hidden";
          frame.style.boxShadow = "0 2px 6px rgba(0,0,0,.4)";
          frame.style.background = "#000";
          frame.style.outline = "none";

          const inner = document.createElement("img");
          inner.src =
            url ||
            `data:image/svg+xml;utf8,${encodeURIComponent(
              '<svg xmlns="http://www.w3.org/2000/svg" width="38" height="54"><rect width="100%" height="100%" fill="#222"/></svg>'
            )}`;
          inner.alt = recent.postedby ? `@${recent.postedby}` : "post";
          inner.style.width = "100%";
          inner.style.height = "100%";
          inner.style.objectFit = "cover";
          frame.appendChild(inner);

          // Optional count badge for grouped posts
          if (g.items.length > 1) {
            const badge = document.createElement("div");
            badge.textContent = String(g.items.length);
            badge.style.position = "absolute";
            badge.style.right = "6px";
            badge.style.top = "6px";
            badge.style.background = "rgba(0,0,0,0.72)";
            badge.style.color = "#fff";
            badge.style.fontSize = "12px";
            badge.style.padding = "2px 6px";
            badge.style.borderRadius = "12px";
            badge.style.lineHeight = "1";
            badge.style.zIndex = "2";
            outer.appendChild(badge);
          }

          outer.appendChild(frame);

          const mk = new google.maps.marker.AdvancedMarkerElement({
            map,
            position: { lat: g.lat, lng: g.lng },
            content: outer,
            title: g.items.length > 1 ? `${g.items.length} posts here` : `@${recent.postedby || ""}`,
          });

          // Keep a reference for show/hide toggling
          mk.__hotspotsEl = outer;

          const open = () => {
            if (g.items.length > 1) {
              setSelectedGroup(g.items);
              setGroupIndex(0);
            } else if (g.items.length === 1) {
               const only = g.items[0];
               // fetch full post
               getPostWithComments(only.postid).then((full) => {
                 setSelectedPost(full);
                 // seed likes too, if you want:
                 setLikedPosts((p) => ({ ...p, [full.postid]: !!full.isLiked }));
                 setLikeCounts((c) => ({ ...c, [full.postid]: full.likeCount || 0 }));
               }).catch(() => {
                 // fallback to lightweight
                 setSelectedPost(only);
               });
             }

          };
          if (mk.addListener) mk.addListener("gmp-click", open);
          outer.addEventListener("click", open);

          return mk;
        });

        markersRef.current = markers;

const DLV_MAP = map; // use the in-scope map instance for visibility logic
function updateLayerVisibility() {
  const b = DLV_MAP.getBounds();
  if (!b) return;

  // filter to visible points first
  const visible = points.filter((p) =>
    Number.isFinite(p.lat) &&
    Number.isFinite(p.lng) &&
    b.contains(new google.maps.LatLng(p.lat, p.lng))
  );

  // group the visible points using the same radius used elsewhere
  const visibleGroups = groupPointsByRadius(visible, CLUSTER_RADIUS_M);

  // determine if any group meets or exceeds the density threshold
  let crowded = visibleGroups.some((g) => g.items.length >= DENSITY_THRESHOLD);

  const zoomLevel = DLV_MAP.getZoom() || 0;
  const hideMarkers = (crowded && zoomLevel < CROWD_HIDE_MAX_ZOOM) || zoomLevel < ZOOM_THRESHOLD;

  if (heatmapRef.current) heatmapRef.current.setMap(hideMarkers ? DLV_MAP : null);

  if (markersRef.current && markersRef.current.length) {
    for (const m of markersRef.current) {
      const el = m.__hotspotsEl || m.content;
      if (el) el.style.display = hideMarkers ? "none" : "block";
    }
  }
}

// initial apply and on viewport changes
updateLayerVisibility();
if (idleListenerRef.current) {
  try { google.maps.event.removeListener(idleListenerRef.current); } catch {}
}
idleListenerRef.current = DLV_MAP.addListener("idle", updateLayerVisibility);

      } catch (e) {
        console.error(e);
        setError("Failed to load map or locations");
      }
    })();

    return () => {
      cancelled = true;
      try {
        if (idleListenerRef.current) {
          google.maps.event.removeListener(idleListenerRef.current);
          idleListenerRef.current = null;
        }
      } catch {}
      if (heatmapRef.current) {
        heatmapRef.current.setMap(null);
        heatmapRef.current = null;
      }
      if (markersRef.current && markersRef.current.length) {
        for (const m of markersRef.current) {
          try {
            const el = m.__hotspotsEl || m.content;
            if (el) el.style.display = "none";
            m.setMap && m.setMap(null);
          } catch {}
        }
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
    <>
    <View style={[styles.app, { paddingTop: 10 }]}>
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
                backgroundColor: "#121821",
                borderRadius: 16,
                padding: 0,
                width: "90%",
                maxWidth: 400,
                alignItems: "center",
                borderWidth: 0,
                outlineWidth: 0,
                borderColor: "transparent",
              }}
            >
              <View style={[styles.postWrapper, { backgroundColor: "#121821", padding: 0 }]}>
                <View style={[
                  styles.postBox,
                  { marginVertical: 0, backgroundColor: "transparent", padding: 0, borderRadius: 11, overflow: "hidden", borderWidth: 0 }
                ]}>
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <Image
                        source={{ uri: (selectedPost && selectedPost.profilepic && selectedPost.profilepic !== "" ? toImageUri(selectedPost.profilepic) : "https://cdn-icons-png.flaticon.com/512/847/847969.png") }}
                        style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10, borderWidth: 1.5, borderColor: "#9CA3AF" }}
                      />
                      <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>@{selectedPost?.postedby || "Unknown"}</Text>
                    </View>
                  </View>
                  { (Number(selectedPost?.posttype) === 1 || isVideoPath(String(selectedPost?.datapath || ""))) ? (
                    <video
                      key={String(selectedPost?.postid || selectedPost?.id || selectedPost?.datapath)}
                      src={toImageUri(selectedPost.datapath)}
                      poster={toImageUri(selectedPost.thumbpath)}
                      playsInline
                      autoPlay
                      muted={!AUDIO_ENABLED}
                      loop
                      controls={false}
                      controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      data-hotspots-video
                      onLoadedMetadata={(e) => {
                        if (AUDIO_ENABLED) {
                          try {
                            e.currentTarget.muted = false;
                            const p = e.currentTarget.play();
                            if (p && typeof p.catch === "function") p.catch(() => {});
                          } catch {}
                        }
                      }}
                      onCanPlay={(e) => {
                        try {
                          if (AUDIO_ENABLED) e.currentTarget.muted = false;
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
                      style={{
                        width: "100%",
                        height: "auto",
                        borderRadius: 14,
                        display: "block",
                        maxHeight: 750,
                        objectFit: "contain",
                        outline: "none"
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
                        borderRadius: 14,
                        outlineWidth: 0
                      }}
                    />
                  )}
<View style={{ paddingHorizontal: 12, paddingVertical: 10 }}>
  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
    <TouchableOpacity onPress={() => toggleLike(String(selectedPost?.postid || selectedPost?.id))}>
      <Ionicons
        name={likedPosts[String(selectedPost?.postid || selectedPost?.id)] ? "heart" : "heart-outline"}
        size={26}
        color={likedPosts[String(selectedPost?.postid || selectedPost?.id)] ? "#F87171" : "#E5E7EB"}
      />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => handleComment(String(selectedPost?.postid || selectedPost?.id))}>
      <Feather name="message-circle" size={24} color="#E5E7EB" />
    </TouchableOpacity>
    <TouchableOpacity onPress={() => { setShareTargetPost(selectedPost); setShareModalVisible(true); }}>
      <Feather name="send" size={22} color="#E5E7EB" />
    </TouchableOpacity>
  </View>

  <Text style={{ color: "#E5E7EB", fontWeight: "600", marginTop: 8 }}>
    {(likeCounts[String(selectedPost?.postid || selectedPost?.id)] || 0)} likes
  </Text>

  <Text style={{ color: "#E5E7EB", marginTop: 6 }}>
    <Text style={{ fontWeight: "bold" }}>
      @{selectedPost?.postedby || "Unknown"}{" "}
    </Text>
    {String(
      selectedPost?.description ||
      selectedPost?.caption ||
      ""
    ).trim() || "(no description)"}
  </Text>
</View>

                </View>
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
                backgroundColor: "transparent",
                borderRadius: 12,
                padding: 0,
                width: "92%",
                maxWidth: 440,
                alignItems: "stretch",
                borderWidth: 0,
                outlineWidth: 0,
                borderColor: "transparent",
              }}
            >
              <View style={[styles.postWrapper, { backgroundColor: "transparent", padding: 0 }]}>
                <View style={[styles.postBox, { paddingBottom: 5, marginVertical: 5, backgroundColor: "transparent", padding: 0, borderRadius: 12, overflow: "hidden", borderWidth: 0 }]}>
                  <div style={{
                    padding: 1,
                    borderRadius: 12,
                    background: "linear-gradient(90deg,#FFD600,#FF7A00,#FF0069,#D300C5,#7638FA)",
                    outline: "none"
                  }}>
                    <div
                      className="hotspots-scroll"
                      style={{
                        maxHeight: "70vh",
                        overflowY: "auto",
                        paddingRight: 6,
                        display: "flex",
                        flexDirection: "column",
                        gap: "16px",
                        background: "#000",
                        borderRadius: 11
                      }}
                    >
                      {selectedGroup.map((it, idx) => {
                        const isVid = Number(it?.posttype) === 1 || isVideoPath(String(it?.datapath || ""));
                        const src = toImageUri(it.datapath);
                        const poster = toImageUri(it.thumbpath);
                        return (
                          <div key={String(it.postid || it.id || idx)} style={{ paddingBottom: 8 }}>
                            <View style={[styles.postBox, { paddingBottom: 8 }]}>
                              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8 }}>
                                <View style={{ flexDirection: "row", alignItems: "center" }}>
                                  <Image
                                    source={{ uri: (it && it.profilepic && it.profilepic !== "" ? toImageUri(it.profilepic) : "https://cdn-icons-png.flaticon.com/512/847/847969.png") }}
                                    style={{ width: 38, height: 38, borderRadius: 19, marginRight: 10, borderWidth: 1.5, borderColor: "#9CA3AF" }}
                                  />
                                  <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>@{it?.postedby || "Unknown"}</Text>
                                </View>
                              </View>
                              {isVid ? (
                                <video
                                  src={src}
                                  poster={poster}
                                  playsInline
                                  autoPlay
                                  muted={!AUDIO_ENABLED}
                                  loop
                                  controls={false}
                                  controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                                  disablePictureInPicture
                                  onContextMenu={(e) => e.preventDefault()}
                                  data-hotspots-video
                                  style={{ width: "100%", height: 520, objectFit: "contain", display: "block", outline: "none" }}
                                  onLoadedMetadata={(e) => {
                                    if (AUDIO_ENABLED) {
                                      try {
                                        e.currentTarget.muted = false;
                                        const p = e.currentTarget.play();
                                        if (p && typeof p.catch === "function") p.catch(() => {});
                                      } catch {}
                                    }
                                  }}
                                  onCanPlay={(e) => {
                                    try {
                                      if (AUDIO_ENABLED) e.currentTarget.muted = false;
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
                                  style={{ width: "100%", height: 520, resizeMode: "contain", outlineWidth: 0 }}
                                />
                              )}
                              <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                                  <TouchableOpacity onPress={() => toggleLike(String(it.postid || it.id))}>
                                    <Ionicons
                                      name={likedPosts[String(it.postid || it.id)] ? "heart" : "heart-outline"}
                                      size={24}
                                      color={likedPosts[String(it.postid || it.id)] ? "#F87171" : "#E5E7EB"}
                                    />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => handleComment(String(it.postid || it.id))}>
                                    <Feather name="message-circle" size={22} color="#E5E7EB" />
                                  </TouchableOpacity>
                                  <TouchableOpacity onPress={() => { setShareTargetPost(it); setShareModalVisible(true); }}>
                                    <Feather name="send" size={20} color="#E5E7EB" />
                                  </TouchableOpacity>
                                </View>

                                <Text style={{ color: "#E5E7EB", fontWeight: "600", marginTop: 8 }}>
                                  {(likeCounts[String(it.postid || it.id)] || 0)} likes
                                </Text>

                                <Text style={{ color: "#E5E7EB", marginTop: 6 }}>
                                  <Text style={{ fontWeight: "bold" }}>@{it.postedby || "Unknown"} </Text>
                                  {String(it?.description || it?.caption || "").trim() || "(no description)"}
                                </Text>

                              </View>
                            </View>
                            {idx < selectedGroup.length - 1 && (
                              <div
                                aria-hidden="true"
                                style={{
                                  height: 2,
                                  background: "linear-gradient(90deg,#FFD600,#FF7A00,#FF0069,#D300C5,#7638FA)",
                                  opacity: 0.7,
                                  borderRadius: 1,
                                  marginTop: 0
                                }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </View>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
      {viewingPost && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setViewingPost(null)}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setViewingPost(null)}
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", paddingHorizontal: 16 }}
          >
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => {}}
              style={{ backgroundColor: "#0B1220", borderRadius: 12, width: "92%", maxWidth: 480, maxHeight: "80%", overflow: "hidden" }}
            >
              <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                <View style={{ padding: 12 }}>
                  <Text style={{ color: "#E5E7EB", fontWeight: "bold", marginBottom: 8 }}>
                    @{viewingPost.postedby}
                  </Text>
                  <View style={{ backgroundColor: "#0B1220" }}>
                    {(Number(viewingPost?.posttype) === 1 || /\.(mp4|mov|webm|ogg|ogv|3gp)$/i.test(String(viewingPost?.datapath || ""))) ? (
                      <video
                        src={toImageUri(viewingPost.datapath)}
                        poster={toImageUri(viewingPost.thumbpath)}
                        playsInline
                        autoPlay
                        muted={!AUDIO_ENABLED}
                        loop
                        controls={false}
                        controlsList="nodownload noplaybackrate noremoteplayback nofullscreen"
                        disablePictureInPicture
                        onContextMenu={(e) => e.preventDefault()}
                        data-hotspots-video
                        style={{ width: "100%", height: 360, objectFit: "contain", display: "block" }}
                      />
                    ) : (
                      <Image source={{ uri: toImageUri(viewingPost.datapath) }} style={{ width: "100%", height: 360, resizeMode: "contain" }} />
                    )}
                  </View>
                  <View style={{ marginTop: 12 }}>
                    <Text style={{ color: "#9CA3AF", fontWeight: "bold", marginBottom: 6 }}>Comments</Text>
                    {Array.isArray(viewingPost.comments) && viewingPost.comments.length ? (
                      viewingPost.comments.map((c) => (
                        <Text key={String(c.commentid || Math.random())} style={{ color: "#E5E7EB", marginBottom: 6 }}>
                          <Text style={{ fontWeight: "bold" }}>@{c.username} </Text>
                          {c.text}
                        </Text>
                      ))
                    ) : (
                      <Text style={{ color: "#9CA3AF" }}>No comments yet.</Text>
                    )}
                    <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 8 }}>
                      <TextInput
                        value={commentText}
                        onChangeText={setCommentText}
                        placeholder="Add a comment…"
                        placeholderTextColor="#9CA3AF"
                        onSubmitEditing={sendComment}
                        editable={!commentSending}
                        style={{ flex: 1, color: "#E5E7EB", backgroundColor: "#121821", borderColor: "#1F2937", borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 }}
                      />
                      <TouchableOpacity
                        onPress={sendComment}
                        disabled={commentSending || !String(commentText).trim()}
                        style={{ backgroundColor: commentSending || !String(commentText).trim() ? "#374151" : "#2563EB", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}
                      >
                        <Text style={{ color: "#E5E7EB", fontWeight: "bold" }}>
                          {commentSending ? "Sending…" : "Send"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={shareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.7)" }}>
          <View style={{ backgroundColor: "#1F2937", borderRadius: 12, padding: 20, width: "80%", maxHeight: "60%" }}>
            <Text style={{ color: "#E5E7EB", fontSize: 18, fontWeight: "bold", marginBottom: 12, textAlign: "center" }}>
              Share Post
            </Text>
            {["dylan", "journey", "hassaan", "fariza"].map((user) => (
              <TouchableOpacity
                key={user}
                style={{ paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: "#374151" }}
                onPress={() => { console.log(`Shared post ${shareTargetPost?.postid || shareTargetPost?.id} with ${user}`); setShareModalVisible(false); }}
              >
                <Text style={{ color: "#E5E7EB", fontSize: 16 }}>@{user}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              onPress={() => setShareModalVisible(false)}
              style={{ marginTop: 20, alignSelf: "center", backgroundColor: "#374151", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}
            >
              <Text style={{ color: "#E5E7EB" }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}