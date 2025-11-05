import React, { useState, useContext, useRef, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Animated,
  Easing,
  Pressable,
} from "react-native";
import { AuthContext } from "../AuthContext";
import { loginUser, registerUser } from "../components/api";
import { styles, colors } from "../stylesLoginPage";

export default function LoginPage() {
  const { login } = useContext(AuthContext);

  // ----- Login state -----
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin() {
    setError("");
    if (!username || !password) {
      setError("Please enter username and password.");
      return;
    }
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 300));
      const user = await loginUser({ username: username.trim(), password });
      await login(user.username, password);
    } catch (e) {
      setError(String(e?.message || "Login failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  // ----- Sign Up modal state -----
  const [showSignUp, setShowSignUp] = useState(false);
  const [suUser, setSuUser] = useState("");
  const [suPass, setSuPass] = useState("");
  const [suPass2, setSuPass2] = useState("");
  const [suBusy, setSuBusy] = useState(false);
  const [suError, setSuError] = useState("");

  // Validation rules
  const isSuValid = useMemo(() => {
    const u = suUser.trim();
    const okUser = u.length >= 3;
    const okPass = suPass.length >= 6;
    const okMatch = suPass === suPass2 && suPass2.length > 0;
    return okUser && okPass && okMatch;
  }, [suUser, suPass, suPass2]);

  const mismatch = useMemo(() => {
    if (!suPass && !suPass2) return false;
    return suPass2.length > 0 && suPass !== suPass2;
  }, [suPass, suPass2]);

  // Slide-up animation
  const sheetY = useRef(new Animated.Value(600)).current; // start off-screen
  const backdrop = useRef(new Animated.Value(0)).current;

  function openSignUp() {
    setShowSignUp(true);
    setSuError("");
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 0,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }

  function closeSignUp() {
    Animated.parallel([
      Animated.timing(sheetY, {
        toValue: 600,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdrop, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setShowSignUp(false);
    });
  }

  async function handleCreateAccount() {
    if (!isSuValid || suBusy) return;
    setSuError("");
    const u = suUser.trim();

    setSuBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 350));
      // Primary registration call
      const regRes = await registerUser({ username: u, password: suPass });

      // ***************************************************************
      // add api here for creating a student or something:
      // e.g., await createStudentProfile({ username: u, authId: regRes?.id });
      // ***************************************************************

      // optional: pre-fill login username and close modal
      setUsername(u);
      setSuPass("");
      setSuPass2("");
      closeSignUp();
    } catch (e) {
      setSuError(String(e?.message || "Sign up failed. Try again."));
    } finally {
      setSuBusy(false);
    }
  }

  // Reset animation positions when closed
  useEffect(() => {
    if (!showSignUp) {
      sheetY.setValue(600);
      backdrop.setValue(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSignUp]);

  return (
    <KeyboardAvoidingView
      style={styles.app}
      behavior={Platform.OS === "android" ? "padding" : undefined}
    >
      {/* ==== Web-only animated gradient backdrop ==== */}
      {Platform.OS === "web" && (
        <>
          <style>{`
            .igwave-wrap {
              position: fixed; inset: 0; z-index: 0; pointer-events: none; overflow: hidden;
              background: linear-gradient(315deg,
                rgba(101,0,94,1) 3%,
                rgba(60,132,206,1) 38%,
                rgba(48,238,226,1) 68%,
                rgba(255,25,25,1) 98%);
              animation: igGradient 15s ease infinite;
              background-size: 400% 400%;
              background-attachment: fixed;
            }
            @keyframes igGradient {
              0% { background-position: 0% 0%;}
              50% { background-position: 100% 100%;}
              100% { background-position: 0% 0%;}
            }
            .igwave {
              background: rgb(255 255 255 / 22%);
              border-radius: 1000% 1000% 0 0;
              position: fixed; width: 200%; height: 12em;
              animation: igWave 10s -3s linear infinite;
              transform: translate3d(0,0,0); opacity: 0.85; bottom: 0; left: 0; z-index: 0; filter: blur(1px);
            }
            .igwave:nth-of-type(2){ bottom:-1.25em; animation: igWave 18s linear reverse infinite; opacity:0.7;}
            .igwave:nth-of-type(3){ bottom:-2.5em; animation: igWave 20s -1s reverse infinite; opacity:0.9;}
            @keyframes igWave {
              2% { transform: translateX(1);}
              25% { transform: translateX(-25%);}
              50% { transform: translateX(-50%);}
              75% { transform: translateX(-25%);}
              100% { transform: translateX(1);}
            }
            .ig-foreground { position: relative; z-index: 1;}
          `}</style>
          <div className="igwave-wrap">
            <div className="igwave"></div>
            <div className="igwave"></div>
            <div className="igwave"></div>
          </div>
        </>
      )}

      {/* ==== Foreground card ==== */}
      <View className="ig-foreground" style={styles.pageWrap}>
        <View style={styles.card}>
          <View style={styles.brandRow}>
            <Text style={styles.brandBadge}>Hotspots</Text>
          </View>

          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>

          {/* Inputs */}
          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder=""
              placeholderTextColor={colors.textDim}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={{ height: 12 }} />

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder=""
              placeholderTextColor={colors.textDim}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
              returnKeyType="go"
              onSubmitEditing={handleLogin}
            />
          </View>

          {!!error && <Text style={styles.error}>{error}</Text>}

          <TouchableOpacity
            onPress={handleLogin}
            disabled={busy}
            activeOpacity={0.9}
            style={[styles.ctaBtn, busy && styles.ctaBtnDisabled]}
          >
            {busy ? (
              <ActivityIndicator color="#1b1406" />
            ) : (
              <Text style={styles.ctaText}>Login</Text>
            )}
          </TouchableOpacity>

          {/* Replace terms line with Sign Up CTA */}
          <View style={styles.signupRow}>
            <Text style={styles.note}>New to Hotspots? </Text>
            <TouchableOpacity onPress={openSignUp} activeOpacity={0.85}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ======= SIGN UP MODAL (Instagram style) ======= */}
      <Modal
        visible={showSignUp}
        animationType="none"
        transparent
        onRequestClose={closeSignUp}
      >
        {/* Backdrop */}
        <Pressable style={styles.modalRoot} onPress={closeSignUp}>
          <Animated.View
            style={[
              styles.modalBackdrop,
              { opacity: backdrop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) },
            ]}
          />
        </Pressable>

        {/* Bottom sheet */}
        <Animated.View
          style={[
            styles.modalSheet,
            { transform: [{ translateY: sheetY }] },
          ]}
        >
          {/* Drag handle */}
          <View style={styles.sheetHandle} />

          <Text style={styles.sheetTitle}>Create your account</Text>
          <Text style={styles.sheetSubtitle}>
            Join the community and start exploring hotspots.
          </Text>

          <View style={styles.fieldWrapAlt}>
            <Text style={styles.label}>Username</Text>
            <TextInput
              placeholder="yourname"
              placeholderTextColor={colors.textDim}
              value={suUser}
              onChangeText={setSuUser}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              returnKeyType="next"
            />
          </View>

          <View style={{ height: 10 }} />

          <View style={styles.fieldWrapAlt}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              value={suPass}
              onChangeText={setSuPass}
              secureTextEntry
              style={styles.input}
              returnKeyType="next"
            />
            {suPass.length > 0 && suPass.length < 6 && (
              <Text style={styles.hint}>Use at least 6 characters.</Text>
            )}
          </View>

          <View style={{ height: 10 }} />

          <View style={styles.fieldWrapAlt}>
            <Text style={styles.label}>Repeat Password</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              value={suPass2}
              onChangeText={setSuPass2}
              secureTextEntry
              style={styles.input}
              returnKeyType="done"
              onSubmitEditing={handleCreateAccount}
            />
            {mismatch && <Text style={styles.hintError}>Passwords don’t match.</Text>}
          </View>

          {!!suError && <Text style={styles.error}>{suError}</Text>}

          <TouchableOpacity
            onPress={handleCreateAccount}
            disabled={!isSuValid || suBusy}
            activeOpacity={0.9}
            style={[
              styles.createBtn,
              (suBusy || !isSuValid) && styles.ctaBtnDisabled,
            ]}
          >
            {suBusy ? (
              <ActivityIndicator color="#1b1406" />
            ) : (
              <Text style={styles.ctaText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={closeSignUp} style={styles.sheetCancel}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
