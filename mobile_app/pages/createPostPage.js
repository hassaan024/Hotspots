import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
    import { styles, colors } from "../stylesCreatePostPage";
import { uploadImage, createPost } from "../components/api";
import { useContext } from "react";
import { AuthContext } from "../AuthContext";

const makeWebVideoThumb = async (videoUri, timeMs = 1000) => {
  const video = document.createElement("video");
  video.src = videoUri;
  video.crossOrigin = "anonymous";
  await new Promise((res, rej) => {
    video.onloadeddata = res;
    video.onerror = () => rej(new Error("Video load error"));
  });
  video.currentTime = Math.min(timeMs / 1000, Math.max((video.duration || 2) - 0.1, 0.1));
  await new Promise((res) => { video.onseeked = res; });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 512;
  canvas.height = video.videoHeight || 512;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  return new Promise((res) => canvas.toBlob((b) => res(b), "image/jpeg", 0.85));
};
export default function CreatePostPage() {
    const [selectedMeta, setSelectedMeta] = useState({ fileName: null, mimeType: null });

  const [selectedUri, setSelectedUri] = useState(null);
  const [caption, setCaption] = useState("");
  const [postedBanner, setPostedBanner] = useState(false);
    const { user: authUser } = useContext(AuthContext);
  // Location state
      const [locationText, setLocationText] = useState("");
  const [locStatus, setLocStatus] = useState("idle"); // idle | fetching | done | error
  const [locError, setLocError] = useState("");
  const [coords, setCoords] = useState({ lat: null, lng: null });

const canPost = Boolean(selectedUri) && locStatus === "done" && !!locationText.trim();

  async function pickImage() {
    // request permission on native (web typically not needed)
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        setLocStatus("error");
        setLocError("Photo library permission denied");
        return;
      }
    }

const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [1, 1], // square crop to match grid vibe
      quality: 0.9,

    });

    if (!result.canceled && result.assets?.length) {
    const a = result.assets[0];
      setSelectedUri(a.uri);
      setSelectedMeta({ fileName: a.fileName ?? null, mimeType: a.mimeType ?? null });
      // reset and detect location right after choosing an image
      setLocationText("");
      setLocStatus("idle");
      setLocError("");
      detectLocation();
    }
  }

  async function detectLocation() {
    setLocError("");
    setLocStatus("fetching");
    setLocationText("");
    setCoords({ lat: null, lng: null });

    try {
      if (Platform.OS === "web" && navigator?.geolocation) {

        await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const { latitude, longitude } = pos.coords || {};
              if (latitude == null || longitude == null) {
                setLocStatus("error");
                setLocError("No coordinates from browser");
                reject(new Error("No coords"));
                return;
              }
              setLocationText(`${latitude.toFixed(5)},${longitude.toFixed(5)}`);
              setLocStatus("done");
              resolve();
            },
            (err) => {
              setLocStatus("error");
              setLocError(err?.message || "Location blocked");
              reject(err);
            },
            { enableHighAccuracy: true, timeout: 8000, maximumAge: 3000 }
          );
        });
        return;
      }

      // Native: try expo-location (optional dependency via dynamic import)
      try {
        const Location = await import("expo-location");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocStatus("error");
          setLocError("Location permission denied");
          return;
        }

        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          mayShowUserSettingsDialog: true,
        });

        const { latitude, longitude } = pos.coords || {};
        if (latitude == null || longitude == null) {
          setLocStatus("error");
          setLocError("No coordinates");
          return;
        }

        // optional: reverse geocode for a nice label
        let pretty = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const parts = await Location.reverseGeocodeAsync({ latitude, longitude });
          const first = parts?.[0];
          if (first) {
            const city = first.city || first.subregion;
            const region = first.region;
            const country = first.isoCountryCode || first.country;
            const label = [city, region, country].filter(Boolean).join(", ");
            if (label) pretty = label;
          }
        } catch {
          // ignore reverse geocode errors, keep coords
        }

        setLocationText(pretty);
        setLocStatus("done");
        return;
      } catch {
        setLocStatus("error");
        setLocError("Location module unavailable");
      }
    } catch (e) {
      setLocStatus("error");
      setLocError(e?.message || "Failed to detect location");
    }
  }

  function onClear() {
    setSelectedUri(null);
    setCaption("");
    setLocationText("");
    setLocStatus("idle");
    setLocError("");
  }

async function onPost() {
  try {
    if (!selectedUri) throw new Error("Pick an image or video first");

    // upload; pass picker metadata when available
    const { filename, mimetype } = await  uploadImage(selectedUri, selectedMeta);
    const isVideo = (mimetype || "").startsWith("video/") ||
                    /\.(mp4|mov|webm|ogg|ogv|3gp)$/i.test(filename);
      // If video: generate & upload a JPG thumbnail
      let thumbname;
      if (isVideo) {
        if (typeof window !== "undefined") {
          // WEB: make a blob thumbnail and upload
          const blob = await makeWebVideoThumb(selectedUri, 1000);
          if (!blob) throw new Error("Could not create video thumbnail");
          const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
          const objUrl = URL.createObjectURL(file);
          const t = await uploadImage(objUrl, { fileName: file.name, mimeType: file.type });
          URL.revokeObjectURL(objUrl);
          thumbname = t.filename;
        } else {
          // NATIVE: use expo-video-thumbnails (lazy require to avoid web bundling)
          const VideoThumbnails = require("expo-video-thumbnails");
          const { uri: thumbUri } = await VideoThumbnails.getThumbnailAsync(selectedUri, { time: 1000 });
          const t = await uploadImage(thumbUri, { fileName: `thumb-${Date.now()}.jpg`, mimeType: "image/jpeg" });
          thumbname = t.filename;
        }
      }
    const payload = {
      postedby: authUser?.username ?? "",
      posttype: isVideo ? 1 : 0,            // 0=image, 1=video
      datapath: filename,                   // plain filename from server
      location: (locationText || "").replace(/\s   /g, ""), // "lat,lng" no spaces
      thumbpath: thumbname,
    };

    // sanity guards
    if (!payload.postedby) throw new Error("No username in AuthContext");
    if (!payload.datapath) throw new Error("datapath (filename) missing");

    await createPost(payload);
    // success UI...
  } catch (e) {
    console.error(e);
    Alert.alert("Post failed", String(e?.message ?? e));
  }
}
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Success banner */}
      {postedBanner && (
        <View style={styles.banner}>
          <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
          <Text style={styles.bannerText}>Posted successfully</Text>
        </View>
      )}

      {/* Title */}
      <View style={styles.titleRow}>
        <Ionicons name="create-outline" size={20} color={colors.brand} />
        <Text style={styles.title}>Create Post</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        {/* Image preview */}
        <View style={styles.previewWrap}>
          {selectedUri ? (
            <Image source={{ uri: selectedUri }} style={styles.previewImage} />
          ) : (
            <View style={styles.previewPlaceholder}>
              <Ionicons name="image-outline" size={28} color={colors.textDim} />
              <Text style={styles.placeholderText}>No image selected</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={pickImage}>
            <Ionicons name="cloud-upload-outline" size={18} color={colors.text} />
            <Text style={styles.actionBtnText}>Choose Image</Text>
          </TouchableOpacity>

          {selectedUri && (
            <TouchableOpacity style={styles.actionBtnGhost} onPress={onClear}>
              <Ionicons name="close-circle-outline" size={18} color={colors.textDim} />
              <Text style={styles.actionBtnGhostText}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Caption */}
        <View style={styles.captionWrap}>
          <Text style={styles.captionLabel}>Caption</Text>
          <TextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="Write something..."
            placeholderTextColor={colors.textDim}
            style={styles.captionInput}
            multiline
            maxLength={2200}
          />
          <Text style={styles.captionCount}>{caption.length}/2200</Text>
        </View>

        {/* Location */}
        <View style={styles.locationWrap}>
          <View style={styles.locationHeader}>
            <Text style={styles.locationLabel}>Location</Text>
            {locStatus === "fetching" && (
              <View style={styles.locLoading}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.locLoadingText}>Detecting…</Text>
              </View>
            )}
            {locStatus === "error" && (
              <Text style={styles.locErrorText}>
                {locError || "Location unavailable"}
              </Text>
            )}
          </View>

          <TextInput
            value={locationText}
            onChangeText={setLocationText}
            placeholder="Location will auto-fill after image is chosen"
            placeholderTextColor={colors.textDim}
            style={[
              styles.locationInput,
              locStatus === "error" && styles.locationInputError,
            ]}
            editable={true}
          />
          <Text style={styles.locationNote}>
            Location is required to post. We auto-detect after you pick an image.
          </Text>
        </View>

        {/* Post */}
        <TouchableOpacity
          style={[styles.postBtn, !canPost && styles.postBtnDisabled]}
          onPress={onPost}
          disabled={!canPost}
        >
          <Ionicons
            name="send"
            size={16}
            color={canPost ? "#1b1400" : "#6b7280"}
          />
          <Text
            style={[styles.postBtnText, !canPost && styles.postBtnTextDisabled]}
          >
            Post
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
