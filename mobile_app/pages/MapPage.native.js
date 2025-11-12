// pages/MapPage.native.js
import React, { useEffect, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Dimensions } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import ProfilePage from "./ProfilePage";
import { listLocations } from "../components/api";
import { Ionicons } from "@expo/vector-icons";
import { PostDetail, toImageUri, inferIsVideo } from "../components/PostsShared";

const { width } = Dimensions.get("window");

export default function MapPage() {
  const [mode, setMode] = useState({ type: "map" }); // "map" | "post" | "profile"

  if (mode.type === "profile") {
    return (
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <TouchableOpacity onPress={() => setMode({ type: "map" })} style={{ padding: 12 }}>
          <Text style={{ color: "#E5E7EB" }}>← Back</Text>
        </TouchableOpacity>
        <ProfilePage route={{ params: { username: mode.username } }} />
      </View>
    );
  }

  if (mode.type === "post") {
    return (
      <PostDetail
        postid={mode.postid}
        onBack={() => setMode({ type: "map" })}
        onOpenProfile={(username) => setMode({ type: "profile", username })}
      />
    );
  }

  return (
    <MapInner
      onOpenPost={(postid) => setMode({ type: "post", postid })}
      onOpenProfile={(username) => setMode({ type: "profile", username })}
    />
  );
}

function MapInner({ onOpenPost, onOpenProfile }) {
  const mapRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [initialRegion, setInitialRegion] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const locs = (await listLocations()) || []; // [{ id, postedby, lat, lng, datapath, thumbpath, posttype }]
        setPoints(locs);

        let region = null;
        const perm = await Location.requestForegroundPermissionsAsync().catch(() => null);
        if (perm?.status === "granted") {
          const pos = await Location.getCurrentPositionAsync({}).catch(() => null);
          if (pos) {
            region = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            };
          }
        }
        if (!region) {
          if (locs.length) {
            region = {
              latitude: Number(locs[0].lat) || 37.773972,
              longitude: Number(locs[0].lng) || -122.431297,
              latitudeDelta: 0.25,
              longitudeDelta: 0.25,
            };
          } else {
            region = { latitude: 39.5, longitude: -98.35, latitudeDelta: 20, longitudeDelta: 20 };
          }
        }
        setInitialRegion(region);
      } catch {
        setInitialRegion({ latitude: 39.5, longitude: -98.35, latitudeDelta: 20, longitudeDelta: 20 });
      }
    })();
  }, []);

  if (!initialRegion) {
    return (
      <View style={{ flex: 1, backgroundColor: "#000", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#60A5FA" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <View style={{ padding: 8 }}>
        <Text style={{ color: "#fff", fontWeight: "600" }}>Map</Text>
      </View>

      <MapView
        ref={mapRef}
        style={{ flex: 1, zIndex: 0 }}
        initialRegion={initialRegion}
        showsUserLocation
        onPress={() => setSelected(null)}
      >
        {points.map((p) => (
          <Marker key={String(p.id)} coordinate={{ latitude: Number(p.lat), longitude: Number(p.lng) }} onPress={() => setSelected(p)} />
        ))}
      </MapView>

      {/* Same UX approach: fully clickable overlay ABOVE the map */}
      {selected && (
        <View
          pointerEvents="box-none"
          style={{ position: "absolute", left: 0, right: 0, bottom: 0, padding: 12, zIndex: 10, elevation: 10 }}
        >
          <View
            pointerEvents="box-only"
            style={{
              alignSelf: "center",
              width: Math.min(520, width - 24),
              backgroundColor: "#0B1220",
              borderRadius: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              overflow: "hidden",
            }}
          >
            {/* header with clickable username */}
            <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingTop: 10 }}>
              <Text
                onPress={() => onOpenProfile(selected.postedby)}
                style={{ color: "#E5E7EB", fontWeight: "700", fontSize: 16 }}
                suppressHighlighting
              >
                @{selected.postedby}
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)} style={{ marginLeft: "auto", padding: 6 }}>
                <Ionicons name="close" size={18} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            {/* media preview (tap to open the SAME PostDetail used in PostsPage) */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => onOpenPost(selected.id)}
              style={{ width: "100%", aspectRatio: 4 / 5, backgroundColor: "#111", marginTop: 8 }}
            >
              {(() => {
                const img = toImageUri(selected.thumbpath || selected.datapath);
                return img ? (
                  <Image source={{ uri: img }} style={{ width: "100%", height: "100%", resizeMode: "cover" }} />
                ) : (
                  <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                    <Text style={{ color: "#9CA3AF" }}>
                      {inferIsVideo(selected?.datapath || "") ? "Video" : "Photo"}
                    </Text>
                  </View>
                );
              })()}
            </TouchableOpacity>

            {/* actions */}
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10 }}>
              <TouchableOpacity
                onPress={() => onOpenProfile(selected.postedby)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#182235", borderRadius: 8 }}
              >
                <Text style={{ color: "#E5E7EB", fontWeight: "600" }}>View Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => onOpenPost(selected.id)}
                style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: "#2563EB", borderRadius: 8 }}
              >
                <Text style={{ color: "#E5E7EB", fontWeight: "700" }}>Open Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
