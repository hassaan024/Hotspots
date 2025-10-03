import React from "react";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import Navbar from "./components/Navbar";
import MapPage from "./pages/MapPage";
import PostsPage from "./pages/PostsPage";
import TestPage from "./pages/TestPage"
import { styles } from "./styles";

export default function App() {
  const [page, setPage] = React.useState("map");

  return (
    <View style={styles.app}>
      <StatusBar style="light" />
      <View style={styles.content}>
        {page === "map" ? <MapPage /> : <PostsPage />}
      </View>
      <Navbar current={page} onChange={setPage} />
    </View>
  );
}
