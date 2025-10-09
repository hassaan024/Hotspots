// pages/MapPage.js
import React, { useEffect, useRef, useState } from "react";
import { View, Text } from "react-native";
import { styles } from "../styles";
import { MarkerClusterer } from "@googlemaps/markerclusterer";

const API_KEY = process.env.API_KEY;
const MAP_ID = "e2597d7067e6b124501ac533";
const Uluru = { lat: -25.344, lng: 131.031 }; // Uluru

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

  const locations = [
    { lat: -31.56391, lng: 147.154312 },
    { lat: -33.718234, lng: 150.363181 },
    { lat: -33.727111, lng: 150.371124 },
    { lat: -33.848588, lng: 151.209834 },
    { lat: -33.851702, lng: 151.216968 },
    { lat: -34.671264, lng: 150.863657 },
    { lat: -35.304724, lng: 148.662905 },
    { lat: -36.817685, lng: 175.699196 },
    { lat: -36.828611, lng: 175.790222 },
    { lat: -37.75, lng: 145.116667 },
    { lat: -37.759859, lng: 145.128708 },
    { lat: -37.765015, lng: 145.133858 },
    { lat: -37.770104, lng: 145.143299 },
    { lat: -37.7737, lng: 145.145187 },
    { lat: -37.774785, lng: 145.137978 },
    { lat: -37.819616, lng: 144.968119 },
    { lat: -38.330766, lng: 144.695692 },
    { lat: -39.927193, lng: 175.053218 },
    { lat: -41.330162, lng: 174.865694 },
    { lat: -42.734358, lng: 147.439506 },
    { lat: -42.734358, lng: 147.501315 },
    { lat: -42.735258, lng: 147.438 },
    { lat: -43.999792, lng: 170.463352 },
  ];

  useEffect(() => {
    let watchId = null;

    (async () => {
      try {
        if (!API_KEY) {
          setError("Missing API KEY");
          return;
        }
        if (typeof window === "undefined") return;

        await loadGoogle();
        const { Map, InfoWindow } = await google.maps.importLibrary("maps");
        const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

        // init map at fallback center
        const map = new Map(mapRef.current, {
          center: Uluru,
          zoom: 6,
          mapId: MAP_ID,
          gestureHandling: "greedy",
        });
        mapInstanceRef.current = map;

        // info window for geolocation messages
        const infoWindow = new InfoWindow();

        // user location, optional
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            pos => {
              const user = { lat: pos.coords.latitude, lng: pos.coords.longitude };
              map.setCenter(user);
              map.setZoom(15);
              new AdvancedMarkerElement({ map, position: user,});
              infoWindow.setPosition(user);
            },
            err => {
              console.warn("getCurrentPosition error:", err?.message || err);
            
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
          );


        } else {
          // geolocation not supported
          infoWindow.setPosition(Uluru);
          infoWindow.setContent("Geolocation not supported");
          infoWindow.open({ map });
        }
        // demo marker
        new AdvancedMarkerElement({ map, position: Uluru, title: "Uluru" });

        // cluster array
        const markers = locations.map((p) => new AdvancedMarkerElement({ map, position: p }));
        new MarkerClusterer({ markers, map });
      } catch (e) {
        console.error(e);
        setError("Failed to load Google Maps");
      }
    })();

    return () => {
      if (watchId != null) navigator.geolocation.clearWatch(watchId);
      mapInstanceRef.current = null;
    };
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
