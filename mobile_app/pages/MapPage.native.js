// pages/MapPage.native.js
import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { listLocations } from "../components/api";

export default function MapPage() {
  const [points, setPoints] = useState([]);
  const [region, setRegion] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const locs = await listLocations();// [{ id, postedby, lat, lng, datapath }]
        setPoints(locs);
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const pos = await Location.getCurrentPositionAsync({});
          setRegion(r => ({
            ...r,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }));
        }
      } catch (e) {
        console.warn("Map native init failed:", e);
      }
    })();
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: "#fff", padding: 8 }}>Map</Text>
      <MapView style={{ flex: 1 }} initialRegion={region}>
        {points.map(p => (
          <Marker
            key={p.id}
            coordinate={{ latitude: p.lat, longitude: p.lng }}
            title={`@${p.postedby}`}
            description={p.datapath ?? ""}
          />
        ))}
      </MapView>
    </View>
  );
}
