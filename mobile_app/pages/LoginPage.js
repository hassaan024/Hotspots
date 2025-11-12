// LoginPage.js
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
  const [suEmail, setSuEmail] = useState("");           // NEW
  const [suPass, setSuPass] = useState("");
  const [suPass2, setSuPass2] = useState("");
  const [suBusy, setSuBusy] = useState(false);
  const [suError, setSuError] = useState("");

  // Validation rules
  const emailLooksOk = useMemo(() => /\S@\S/.test(suEmail), [suEmail]); // minimal check
  const isSuValid = useMemo(() => {
    const u = suUser.trim();
    const okUser = u.length >= 3;
    const okEmail = emailLooksOk;
    const okPass = suPass.length >= 6;
    const okMatch = suPass === suPass2 && suPass2.length > 0;
    return okUser && okEmail && okPass && okMatch;
  }, [suUser, suEmail, suPass, suPass2, emailLooksOk]);

  const mismatch = useMemo(() => {
    if (!suPass && !suPass2) return false;
    return suPass2.length > 0 && suPass !== suPass2;
  }, [suPass, suPass2]);

  // Slide-up animation
  const sheetY = useRef(new Animated.Value(600)).current;
  const backdrop = useRef(new Animated.Value(0)).current;

  function openSignUp() {
    setShowSignUp(true);
    setSuError("");
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 0, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
    ]).start();
  }

  function closeSignUp() {
    Animated.parallel([
      Animated.timing(sheetY, { toValue: 600, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      Animated.timing(backdrop, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setShowSignUp(false);
    });
  }

  async function handleCreateAccount() {
    if (!isSuValid || suBusy) return;
    setSuError("");
    const u = suUser.trim();
    const email = suEmail.trim();

    setSuBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 350));

      // Create user in DB (username + email + password)
      const regRes = await registerUser({ username: u, email, password: suPass });

      // If API returned a token or a user, try to log in seamlessly; else prefill the login form.
      if (regRes?.token || regRes?.user) {
        try {
          // Some APIs auto-auth on register and return token+user; your AuthContext probably expects login()
          await login(u, suPass);
        } catch {
          // If your AuthContext login requires calling loginUser instead:
          const user = await loginUser({ username: u, password: suPass });
          await login(user.username, suPass);
        }
      } else {
        // Prefill and close if no token returned
        setUsername(u);
      }

      // clean up and close
      setSuPass("");
      setSuPass2("");
      closeSignUp();
    } catch (e) {
      setSuError(String(e?.message || "Sign up failed. Try again."));
    } finally {
      setSuBusy(false);
    }
  }

  useEffect(() => {
    if (!showSignUp) {
      sheetY.setValue(600);
      backdrop.setValue(0);
    }
  }, [showSignUp, sheetY, backdrop]);

  return (
    <KeyboardAvoidingView style={styles.app} behavior={Platform.OS === "android" ? "padding" : undefined}>
      {/* … backdrop styles unchanged … */}

      {/* ==== Foreground card ==== */}
      <View className="ig-foreground" style={styles.pageWrap}>
        <View style={styles.card}>
          <View style={styles.brandRow}><Text style={styles.brandBadge}>Hotspots</Text></View>
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

          <TouchableOpacity onPress={handleLogin} disabled={busy} activeOpacity={0.9} style={[styles.ctaBtn, busy && styles.ctaBtnDisabled]}>
            {busy ? <ActivityIndicator color="#1b1406" /> : <Text style={styles.ctaText}>Login</Text>}
          </TouchableOpacity>

          <View style={styles.signupRow}>
            <Text style={styles.note}>New to Hotspots? </Text>
            <TouchableOpacity onPress={openSignUp} activeOpacity={0.85}>
              <Text style={styles.signupLink}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ======= SIGN UP MODAL ======= */}
      <Modal visible={showSignUp} animationType="none" transparent onRequestClose={closeSignUp}>
        {/* Backdrop */}
        <Pressable style={styles.modalRoot} onPress={closeSignUp}>
          <Animated.View
            style={[styles.modalBackdrop, { opacity: backdrop.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }) }]}
          />
        </Pressable>

        {/* Bottom sheet */}
        <Animated.View style={[styles.modalSheet, { transform: [{ translateY: sheetY }] }]}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Create your account</Text>
          <Text style={styles.sheetSubtitle}>Join the community and start exploring hotspots.</Text>

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

          {/* NEW: Email */}
          <View style={styles.fieldWrapAlt}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              placeholder="you@example.com"
              placeholderTextColor={colors.textDim}
              value={suEmail}
              onChangeText={setSuEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              returnKeyType="next"
            />
            {!!suEmail && !emailLooksOk && <Text style={styles.hintError}>Enter a valid email.</Text>}
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
            {suPass.length > 0 && suPass.length < 6 && <Text style={styles.hint}>Use at least 6 characters.</Text>}
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
            style={[styles.createBtn, (suBusy || !isSuValid) && styles.ctaBtnDisabled]}
          >
            {suBusy ? <ActivityIndicator color="#1b1406" /> : <Text style={styles.ctaText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={closeSignUp} style={styles.sheetCancel}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </KeyboardAvoidingView>
  );
}
