// pages/MapPage.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";
import { MarkerClusterer } from "@googlemaps/markerclusterer";
import { listLocations } from "../components/api";

const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
const MAP_ID = "e2597d7067e6b124501ac533";

const Uluru = { lat: -25.344, lng: 131.031 };

function loadGoogle() {
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector('script[data-gmaps="1"]');
    if (!script) {
      script = document.createElement("script");
      script.src =
        `https://maps.googleapis.com/maps/api/js?key=${API_KEY}` +
        `&v=beta&libraries=maps,marker&loading=async`;
      script.async = true;
      script.defer = true;
      script.dataset.gmaps = "1";
      document.head.appendChild(script);
    }
    script.addEventListener("load", resolve, { once: true });
    script.addEventListener("error", reject, { once: true });
  });
}

export default function MapPage() {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (!API_KEY) { setError("Missing API KEY"); return; }
        if (typeof window === "undefined") return;


        const points = await listLocations(); //[{ id, postedby, lat, lng, datapath }]

        await loadGoogle();
        const { Map, InfoWindow } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");
        if (cancelled) return;

        const map = new Map(mapRef.current, {
          center: Uluru, zoom: 6, mapId: MAP_ID, gestureHandling: "greedy",
        });
        mapInstanceRef.current = map;

        const infoWindow = new InfoWindow();
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            pos => { const user = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              map.setCenter(user); map.setZoom(15);
              new AdvancedMarkerElement({ map, position: user });
            },
            () => {}, { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );
        }

        const markers = points.map(p =>
          new AdvancedMarkerElement({
            map,
            position: { lat: p.lat, lng: p.lng },
            title: `@${p.postedby}`,
          })
        );
        new MarkerClusterer({ markers, map });
      } catch (e) {
        console.error(e);
        setError("Failed to load map or locations");
      }
    })();

    return () => { cancelled = true; mapInstanceRef.current = null; };
  }, []);

  return (
    <View style={styles.screen}>
      <Text style={styles.screenTitle}>Map</Text>
      {error ? (
        <Text style={styles.screenSub}>{error}</Text>
      ) : (
        <View
          ref={mapRef}
          style={[
            styles.mapContainer || { flex: 1 },
            { minHeight: 400, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#ddd" }
          ]}
        />
      )}
    </View>
  );
}
