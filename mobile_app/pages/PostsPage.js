import React, { useEffect, useState, useCallback } from "react";
import { View, Text, Image, Dimensions, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { styles } from "../styles";
import { listPosts, API_BASE } from "../components/api";



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
      let imgUri = toImageUri(item.datapath);
      console.log(item.datapath)
      //console.log(item.postid)
      return (
        <View style={[styles.postWrapper, { height}]}>
          <Text style={styles.username}>@{item.postedby}</Text>
          <View style={styles.postBox}>
            <Image
              source={{ uri: imgUri }}
              style={{ width: "100%", height: height, resizeMode: "contain" }}
            />
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




