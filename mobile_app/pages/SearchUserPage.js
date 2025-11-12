// SearchUser.js
import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { styles, ig } from "../stylesSearchUserPage";
import ProfilePage from "./ProfilePage";
import { listUsers, getFollowCounts, API_BASE } from "../components/api";

// normalize possible relative avatar paths to absolute URLs
function toAbsUri(path) {
  if (!path) return null;
  const s = String(path);
  if (/^https?:\/\//i.test(s)) return s;
  const base = (API_BASE || "").replace(/\/$/, "");
  if (s.startsWith("/")) return `${base}${s}`;
  return `${base}/uploads/${s.replace(/^\.?\//, "")}`;
}

function formatNum(n) {
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

// How many users to prefetch counts for ranking "Top users"
const TOP_PREFETCH = 24;

export default function SearchUser() {
  const [viewUser, setViewUser] = useState(null); // null => show search list
  return viewUser ? (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <TouchableOpacity
        onPress={() => setViewUser(null)}
        style={{ padding: 12, alignSelf: "flex-start" }}
      >
        <Text style={{ color: "#E5E7EB" }}>← Back</Text>
      </TouchableOpacity>
      <ProfilePage route={{ params: { username: viewUser } }} />
    </View>
  ) : (
    <SearchUserList onOpenProfile={setViewUser} />
  );
}

function SearchUserList({ onOpenProfile }) {
  const [query, setQuery] = useState("");
  const [animate, setAnimate] = useState(true);

  const [users, setUsers] = useState([]); // [{id, username, avatar, followers?, following?}]
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // countsMap: { username: { followers, following } }
  const [countsMap, setCountsMap] = useState({});

  useEffect(() => {
    const t = setTimeout(() => setAnimate(false), 900);
    return () => clearTimeout(t);
  }, []);

  // fetch user directory
  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      setLoadError(null);
      try {
        const data = await listUsers();
        if (cancelled) return;

        const normalized = (Array.isArray(data) ? data : []).map((u) => {
          const username = String(u.username ?? "").trim();
          const followers = u.followersCount ?? u.followers;
          const following = u.followingCount ?? u.following;
          // pre-seed countsMap if API already gave us numbers
          if (
            username &&
            (Number.isFinite(Number(followers)) ||
              Number.isFinite(Number(following)))
          ) {
            // stage into a local map; we’ll batch-set once
          }
          return {
            id: String(u.userid ?? u.id ?? username),
            username,
            avatar:
              toAbsUri(u.profilepic) ||
              "https://cdn-icons-png.flaticon.com/512/847/847969.png",
            followers:
              Number.isFinite(Number(followers)) ? Number(followers) : null,
            following:
              Number.isFinite(Number(following)) ? Number(following) : null,
          };
        });

        // seed countsMap from API-provided fields
        const seed = {};
        for (const u of normalized) {
          if (u.username) {
            const f1 = Number.isFinite(u.followers) ? u.followers : null;
            const f2 = Number.isFinite(u.following) ? u.following : null;
            if (f1 !== null || f2 !== null) {
              seed[u.username] = {
                followers: f1 ?? 0,
                following: f2 ?? 0,
              };
            }
          }
        }

        setUsers(normalized);
        if (Object.keys(seed).length) {
          setCountsMap((prev) => ({ ...seed, ...prev }));
        }
      } catch (e) {
        setLoadError(e?.message || "Failed to load users");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  // helper: ensure we have counts for a set of usernames
  const ensureCounts = useCallback(async (usernames) => {
    const need = usernames.filter(
      (u) => u && !countsMap[u] // only fetch missing
    );
    if (!need.length) return;

    // Limit concurrency a bit
    const chunk = async (arr, size) => {
      for (let i = 0; i < arr.length; i += size) {
        const slice = arr.slice(i, i + size);
        const results = await Promise.allSettled(
          slice.map(async (uname) => {
            try {
              const { followers, following } = await getFollowCounts(uname);
              return { uname, followers, following };
            } catch {
              return { uname, followers: 0, following: 0 };
            }
          })
        );
        const add = {};
        for (const r of results) {
          if (r.status === "fulfilled" && r.value?.uname) {
            const { uname, followers, following } = r.value;
            add[uname] = {
              followers: Number(followers) || 0,
              following: Number(following) || 0,
            };
          } else if (r.status === "rejected") {
            // ignore; keep missing
          }
        }
        if (Object.keys(add).length) {
          setCountsMap((prev) => ({ ...prev, ...add }));
        }
      }
    };

    await chunk(need, 6); // 6 concurrent lookups at a time
  }, [countsMap]);

  // build the display rows with counts (from API fields or countsMap)
  const decorate = useCallback(
    (arr) =>
      arr.map((u) => {
        const counts = countsMap[u.username];
        return {
          ...u,
          followers:
            counts?.followers ??
            (Number.isFinite(u.followers) ? u.followers : 0),
          following:
            counts?.following ??
            (Number.isFinite(u.following) ? u.following : 0),
        };
      }),
    [countsMap]
  );

  // results when searching
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const filtered = users.filter((u) =>
      u.username.toLowerCase().includes(q)
    );
    return decorate(filtered);
  }, [query, users, decorate]);

  // "Top users" when query is empty — rank by followers desc
  const topUsers = useMemo(() => {
    if (query.trim().length > 0) return [];
    const decorated = decorate(users);
    const withCounts = decorated.filter((u) => Number.isFinite(u.followers));
    const withoutCounts = decorated.filter((u) => !Number.isFinite(u.followers));

    // sort those with counts first
    withCounts.sort((a, b) => (b.followers || 0) - (a.followers || 0));
    // keep users w/o counts at the end (stable)
    return [...withCounts, ...withoutCounts].slice(0, TOP_PREFETCH);
  }, [users, query, decorate]);

  // Prefetch counts for: (a) top users, and (b) visible search results
  useEffect(() => {
    if (query.trim().length === 0 && topUsers.length) {
      const names = topUsers.map((u) => u.username).filter(Boolean);
      ensureCounts(names);
    }
  }, [query, topUsers, ensureCounts]);

  useEffect(() => {
    if (query.trim().length > 0 && results.length) {
      const names = results.slice(0, 20).map((u) => u.username).filter(Boolean);
      ensureCounts(names);
    }
  }, [query, results, ensureCounts]);

  const renderItem = ({ item }) => (
    <View style={styles.frameOuter}>
      <LinearGradient colors={ig.borderGradientSoft} style={styles.frameGradient}>
        <View style={styles.card}>
          <View style={styles.cardRow}>
            {/* Avatar */}
            <TouchableOpacity
              style={styles.avatarWrap}
              onPress={() => onOpenProfile(item.username)}
            >
              <Image source={{ uri: item.avatar }} style={styles.avatar} />
            </TouchableOpacity>

            <View style={styles.cardCenter}>
              <Text
                style={styles.usernameBig}
                onPress={() => onOpenProfile(item.username)}
              >
                @{item.username}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>
                  <Text style={styles.metaStrong}>{formatNum(item.followers || 0)}</Text>{" "}
                  followers
                </Text>
                <View style={styles.metaDot} />
                <Text style={styles.meta}>
                  <Text style={styles.metaStrong}>{formatNum(item.following || 0)}</Text>{" "}
                  following
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.profileBtn}
              activeOpacity={0.9}
              onPress={() => onOpenProfile(item.username)}
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

  const listData =
    query.trim().length === 0 ? topUsers : results;

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
            <Ionicons name="search" size={18} color="#b0b5bf" style={styles.searchIcon} />
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

      {/* Loading / errors / list */}
      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator color="#c7cad1" />
          <Text style={styles.emptyText}>Loading users…</Text>
        </View>
      ) : loadError ? (
        <View style={styles.emptyState}>
          <Ionicons name="alert-circle" size={26} color="#c7cad1" />
          <Text style={styles.emptyTitle}>Couldn’t load</Text>
          <Text style={styles.emptyText}>{String(loadError)}</Text>
        </View>
      ) : listData.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search" size={26} color="#c7cad1" />
          <Text style={styles.emptyTitle}>
            {query.trim().length === 0 ? "No top users yet" : "No results"}
          </Text>
          <Text style={styles.emptyText}>
            {query.trim().length === 0
              ? "Once your app has users with followers, they’ll appear here."
              : <>No usernames matching <Text style={styles.queryEm}>{query}</Text>.</>}
          </Text>
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
