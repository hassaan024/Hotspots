import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Dimensions, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { styles } from "../styles";
import { listPosts, API_BASE } from "../components/api";
import { Platform } from "react-native";

import { Video } from "expo-av";
const isWeb = typeof window !== "undefined" && typeof document !== "undefined";

// optional: lazy import Video for native
let VideoComp = null;
try { VideoComp = require("expo-av").Video; } catch {}

const Media = ({ uri, isVideo, height }) => {
  if (!isVideo) {
    return (
      <Image
        source={{ uri }}
        style={{ width: "100%", height, resizeMode: "contain" }}
      />
    );
  }
  // video path
  return isWeb ? (
    <video
      src={uri}
      controls
      // display:block avoids inline-video layout gaps inside bordered containers
      style={{ width: "100%", height, display: "block", objectFit: "contain" }}
    />
  ) : (
    VideoComp ? (
      <VideoComp
        source={{ uri }}
        style={{ width: "100%", height }}
        useNativeControls
        resizeMode="contain"
      />
    ) : null
  );
};

function toImageUri(datapath) {
  if (!datapath) return null;
  if (/^https?:\/\//i.test(datapath)) return datapath;
  if (datapath.startsWith("/")) return `${API_BASE}${datapath}`;
  const clean = datapath.replace(/^\.?\//, "");
  return `${API_BASE}/uploads/${clean}`;
}

export default function PostsPage() {
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  //TODO make scalable with window/device resolution
   const width = 768;
   const height = 1024;

  const load = useCallback(async () => {
    setErr(null);
    try {
      const data = await listPosts();//expects [postedby, posttype, datapath }]
      setPosts(data);
    } catch (e) {
      setErr(String(e.message ?? e));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

    useEffect(() => { load(); }, [load]);

const renderItem = ({ item }) => {
  const uri = toImageUri(item.datapath);
  const isVideo = Number(item.posttype) === 1;

  return (
    <View style={[styles.postWrapper, { height }]}>
      <Text style={styles.username}>@{item.postedby}</Text>

      {/* This container holds the border for BOTH media types */}
      <View style={styles.postBox}>
        <Media uri={uri} isVideo={isVideo} height={height} />
      </View>
    </View>
  );
};

    const getItemLayout = (_data, index) => ({
      length: height,
      offset: height * index,
      index,
    });


  return (
    <FlatList
      data={posts}
      renderItem={renderItem}
      keyExtractor={(item) => String(item.postid)}
      showsVerticalScrollIndicator={false}
      pagingEnabled={false}
      snapToAlignment={undefined}
      decelerationRate="normal"
      getItemLayout={undefined}
      removeClippedSubviews
      initialNumToRender={6}
      windowSize={7}
      //contentContainerStyle={{ paddingTop: HEADER_HEIGHT, paddingBottom: NAVBAR_HEIGHT + 12 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); load(); }}
          tintColor="#fff"
        />
      }
      ListEmptyComponent={
        <Text style={{ color: "#fff", textAlign: "center", marginTop: 24 }}>
          No posts yet.
        </Text>
      }
    />
  );
  }




