// SearchUser.js
import React, { useMemo, useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { styles, ig } from "../stylesSearchUserPage";

const DUMMY_USERS = [
  {
    id: "1",
    username: "hassaan",
    avatar:
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?q=80&w=256&auto=format&fit=crop",
    followers: 1203,
    following: 381,
  },
  {
    id: "2",
    username: "dev_amy",
    avatar:
      "https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=256&auto=format&fit=crop",
    followers: 980,
    following: 210,
  },
  {
    id: "3",
    username: "mike42",
    avatar:
      "https://images.unsplash.com/photo-1506898665064-7b6a174f3f1f?q=80&w=256&auto=format&fit=crop",
    followers: 240,
    following: 75,
  },
  {
    id: "4",
    username: "sana.codes",
    avatar:
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2c?q=80&w=256&auto=format&fit=crop",
    followers: 4205,
    following: 801,
  },
  {
    id: "5",
    username: "pk_dev",
    avatar:
      "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?q=80&w=256&auto=format&fit=crop",
    followers: 333,
    following: 190,
  },
];

export default function SearchUser() {
  const [query, setQuery] = useState("");
  const [animate, setAnimate] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(false), 900);
    return () => clearTimeout(timer);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return DUMMY_USERS.filter((u) => u.username.toLowerCase().includes(q));
  }, [query]);

  const renderItem = ({ item }) => (
    <View style={styles.frameOuter}>
      <LinearGradient colors={ig.borderGradientSoft} style={styles.frameGradient}>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            {/* Avatar wrapper ensures circle shape */}
            <View style={styles.avatarWrap}>
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            </View>

            <View style={styles.cardCenter}>
              <Text style={styles.usernameBig}>@{item.username}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  <Text style={styles.metaStrong}>{formatNum(item.followers)}</Text>{" "}
                  followers
                </Text>
                <View style={styles.metaDot} />
                <Text style={styles.meta}>
                  <Text style={styles.metaStrong}>{formatNum(item.following)}</Text>{" "}
                  following
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileBtn}
              activeOpacity={0.9}
              onPress={() => {
                // TODO: route to profile page here
                // navigation.navigate("Profile", { username: item.username });
              }}
            >
              <LinearGradient
                colors={ig.buttonGradientIG}
                start={[0, 0]}
                end={[1, 1]}
                style={styles.profileBtnBg}
              >
                <Ionicons name="person-circle" size={16} color="#fff" />
                <Text style={styles.profileBtnText}>View</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>
    </View>
  );

  return (
    <View style={styles.screen}>
      {Platform.OS === "web" && (
        <style>{`
          @keyframes expandSearch {
            0% { transform: scaleX(0.3); opacity: 0; }
            60% { transform: scaleX(1.05); opacity: 1; }
            100% { transform: scaleX(1); opacity: 1; }
          }
          .expandSearch {
            animation: expandSearch .85s cubic-bezier(.65,0,.35,1);
            transform-origin: center;
          }
        `}</style>
      )}

      {/* Search Bar */}
      <View
        style={styles.searchOuter}
        className={Platform.OS === "web" && animate ? "expandSearch" : ""}
      >
        <LinearGradient colors={ig.borderGradientBright} style={styles.searchBorder}>
          <View style={styles.searchWrap}>
            <Ionicons
              name="search"
              size={18}
              color="#b0b5bf"
              style={styles.searchIcon}
            />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search by username…"
              placeholderTextColor="#9aa0aa"
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.searchInput}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9aa0aa" />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Results */}
      {query.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons
            name={Platform.OS === "ios" ? "sparkles" : "sparkles-outline"}
            size={28}
            color="#c7cad1"
          />
          <Text style={styles.emptyTitle}>Find people</Text>
          <Text style={styles.emptyText}>Type a username to discover profiles.</Text>
        </View>
      ) : results.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={26} color="#c7cad1" />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptyText}>
            No usernames matching <Text style={styles.queryEm}>{query}</Text>.
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}
