import { Platform } from "react";

const ENV_BASE = process.env.EXPO_PUBLIC_API_URL;
console.log(ENV_BASE)
export const API_BASE = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE) {
  throw new Error('Set EXPO_PUBLIC_API_URL');
}

// Users
export async function listUsers() {
  const r = await fetch(`${API_BASE}/api/users`);
  if (!r.ok) throw new Error(`Users failed: ${r.status}`);
  return r.json();
}
export async function getUser(username) {
  const r = await fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}`);
  if (!r.ok) throw new Error(`User not found: ${r.status}`);
  return r.json();
}
export async function createUser(input) {
  const r = await fetch(`${API_BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!r.ok) throw new Error(`Create user failed: ${r.status}`);
  return r.json();
}

export async function loginUser({ username, password }) {
  const r = await fetch(`${API_BASE}/api/users/login`, {

  method: "POST",
  headers: { "Content-Type": "application/json", "Accept": "application/json" },
  body: JSON.stringify({ username, password }),
});
console.log('req url =', `${API_BASE}/api/users/login`);
console.log('final url =', r.url, 'redirected =', r.redirected, 'status =', r.status);
console.log('content-type =', r.headers.get('content-type'));
const contentType = r.headers.get("content-type") || "";
const text = await r.text();
console.log('login status=', r.status, 'ctype=', contentType, 'first100=', text.slice(0,100));
if (!contentType.includes("application/json")) {
  throw new Error(`Expected JSON but got ${contentType}. Starts with: ${text.slice(0,120)}`);
}
return JSON.parse(text);
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(text || `Login failed: ${r.status}`);
  }
  return r.json();
}

//Posts
export async function listPosts() {
  const r = await fetch(`${API_BASE}/api/posts`);
  if (!r.ok) throw new Error(`Posts failed: ${r.status}`);
  return r.json();
}
export async function createPost(input) {
  const r = await fetch(`${API_BASE}/api/posts`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!r.ok) throw new Error(`Create post failed: ${r.status}`);
  return r.json();
}
export async function listUserPosts(username) {
  const r = await fetch(`${API_BASE}/api/posts?postedby=${encodeURIComponent(username)}`);
  if (!r.ok) throw new Error(`Posts failed: ${r.status}`);
  return r.json();
}


// Maps
export async function listLocations() {
  const r = await fetch(`${API_BASE}/api/posts/locations`);
  if (!r.ok) throw new Error(`Locations failed: ${r.status}`);
  return r.json(); // [{ id, postedby, lat, lng, datapath }]
}

// add these exports
export async function listFollowers(username) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}/followers`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load followers (${res.status})`);
  return await res.json(); // [{ follower, followedAt }, ...]
}

export async function listFollowing(username) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}/following`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load following (${res.status})`);
  return await res.json(); // [{ followee, followedAt }, ...]
}

export async function getFollowCounts(username) {
  const [followers, following] = await Promise.all([
    listFollowers(username),
    listFollowing(username),
  ]);
  return { followers: followers.length, following: following.length };
}
export async function uploadImage(imageUri) {
  const base = (API_BASE || "").replace(/\/+$/, "");
  const name = imageUri.split("/").pop() || `image-${Date.now()}.jpg`;
  const type = name.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";

  const isBrowser =
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof File !== "undefined";

  async function attempt(fieldName) {
    const form = new FormData();

    if (isBrowser) {
      const resp = await fetch(imageUri);
      const blob = await resp.blob();
      const file = new File([blob], name, { type: blob.type || type });
      form.append(fieldName, file);
    } else {
      form.append(fieldName, { uri: imageUri, name, type });
    }

    const res = await fetch(`${base}/api/posts/upload`, {
      method: "POST",
      credentials: "include",
      body: form, // DO NOT set Content-Type yourself
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = new Error(`Upload failed ${res.status}: ${txt}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json().catch(() => ({}));
    let filename = data.filename || data.path || data.file;
    if (!filename) throw new Error("Server did not return a filename/path");
    return filename.replace(/^\/?uploads\/+/i, "");
  }

  try {
    return await attempt("file");
  } catch (e) {
    if (e?.status === 400 || e?.status === 415) {
      return await attempt("image");
    }
    throw e;
  }
}

