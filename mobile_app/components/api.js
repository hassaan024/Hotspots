import { Platform } from "react";

const ENV_BASE = process.env.EXPO_PUBLIC_API_URL;
console.log(ENV_BASE)
export const API_BASE = process.env.EXPO_PUBLIC_API_URL;
if (!API_BASE) {
  throw new Error('Set EXPO_PUBLIC_API_URL');
}
let AUTH_TOKEN = null;
export function setAuthToken(t) { AUTH_TOKEN = t; }
function authHeaders() {
  return AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {};
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
  const payload = JSON.parse(text);
  // expect: { user: {...}, token: "..." }
  if (payload?.token) setAuthToken(payload.token);
  return payload.user ?? payload;
}

//Posts
export async function listPosts() {
  const r = await fetch(`${API_BASE}/api/posts`, {
    credentials: "include",
    headers: {
      ...authHeaders(),
    },
  });
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
  if (!r.ok) {
   let msg = `${r.status}`;
    try {
      const t = await r.text();
      msg = `${r.status} – ${t}`;
    } catch {}
    throw new Error(`Create post failed: ${msg}`);
  }  return r.json();
}
export async function listUserPosts(username) {
  const r = await fetch(`${API_BASE}/api/posts?postedby=${encodeURIComponent(username)}`, {
    credentials: "include",
    headers: {
      ...authHeaders(),
    },
  });
  if (!r.ok) throw new Error(`Posts failed: ${r.status}`);
  return r.json();
}


// Maps
export async function listLocations() {
  const r = await fetch(`${API_BASE}/api/posts/locations`, { credentials: "include" });
  if (!r.ok) throw new Error(`locations failed: ${r.status}`);
  return r.json(); // [{ id, postedby, lat, lng, datapath, thumbpath, posttype }]
}

// add these exports
export async function listFollowers(username) {
  const res = await fetch(`${API_BASE}/api/users/${encodeURIComponent(username)}/followers`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to load followers (${res.status})`);
  return await res.json(); // [{ follower,  }, ...]
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
// usage: const filename = await uploadMedia(uri, { fileName: asset.fileName, mimeType: asset.mimeType });

export async function uploadImage(mediaUri, meta = {}) {
  const base = (API_BASE || "").replace(/\/+$/, "");

  const isWeb = typeof window !== "undefined" && typeof document !== "undefined" && typeof File !== "undefined";

  // simple map to fix extensions when needed
  const extByMime = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/ogg": "ogv",
    "video/quicktime": "mov",
    "video/3gpp": "3gp",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
  };

  const inferExtFromMime = (mime) => {
    if (!mime) return "";
    const ext = extByMime[mime] || mime.split("/")[1] || "";
    return ext ? `.${ext}` : "";
  };

  const inferMimeFromName = (name = "") => {
    const n = name.toLowerCase();
    if (n.endsWith(".png")) return "image/png";
    if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
    if (n.endsWith(".webp")) return "image/webp";
    if (n.endsWith(".gif")) return "image/gif";
    if (n.endsWith(".mp4")) return "video/mp4";
    if (n.endsWith(".mov")) return "video/quicktime";
    if (n.endsWith(".webm")) return "video/webm";
    if (n.endsWith(".ogv")) return "video/ogg";
    if (n.endsWith(".3gp")) return "video/3gpp";
    return "";
  };

  async function attempt(fieldName) {
    const form = new FormData();

    if (isWeb) {
      // WEB: turn blob/object URL into a File and preserve blob.type
      const resp = await fetch(mediaUri);
      const blob = await resp.blob();
      const ext = inferExtFromMime(blob.type) || ".bin";
      const safeName = (meta.fileName && /\.[a-z0-9]+$/i.test(meta.fileName)) ? meta.fileName : `upload-${Date.now()}${ext}`;
      const file = new File([blob], safeName, { type: blob.type || "application/octet-stream" });
      form.append(fieldName, file);
    } else {
      // NATIVE (Expo / RN): prefer picker-provided metadata
      const guessedNameFromUri = (mediaUri.split("/").pop() || "").trim();
      const pickedName = meta.fileName || guessedNameFromUri || `upload-${Date.now()}`;
      const pickedMime = meta.mimeType || inferMimeFromName(pickedName) || "application/octet-stream";

      // ensure the name has the proper extension for the MIME (helps server/clients)
      const hasExt = /\.[a-z0-9]+$/i.test(pickedName);
      const finalExt = hasExt ? "" : inferExtFromMime(pickedMime);
      const finalName = hasExt ? pickedName : `${pickedName}${finalExt || ""}`;

      form.append(fieldName, { uri: mediaUri, name: finalName, type: pickedMime });
    }

    const res = await fetch(`${base}/api/posts/upload`, {
      method: "POST",
      credentials: "include",
      body: form, // don't set Content-Type
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      const err = new Error(`Upload failed ${res.status}: ${txt}`);
      err.status = res.status;
      throw err;
    }

    const data = await res.json().catch(() => ({}));
    // OPTIONAL: if you update server, return mimetype too: { filename, mimetype }
    let filename = data.filename || data.path || data.file;
    if (!filename) throw new Error("Server did not return a filename/path");

    // normalize to plain filename (no leading /uploads/)
    filename = filename.replace(/^\/?uploads\/+/i, "");

    // bubble up mimetype if server sends it; else infer from filename
    const mimetype = data.mimetype || inferMimeFromName(filename) || meta.mimeType || "";

    return { filename, mimetype };
  }

  try {
    return await attempt("file");
  } catch (e) {
    if (e?.status === 400 || e?.status === 415) {
      return await attempt("image"); // some servers use upload.single("image")
    }
    throw e;
  }

}


// --- Comments API ---
export async function listComments(postid, { parentid = null, after_ts = null, after_id = null, limit = 20 } = {}) {
  const qs = new URLSearchParams();
  if (parentid != null) qs.set("parentid", String(parentid));
  if (after_ts) qs.set("after_ts", after_ts);
  if (after_id) qs.set("after_id", String(after_id));
  if (limit) qs.set("limit", String(limit));

  const r = await fetch(`${API_BASE}/api/posts/${postid}/comments?${qs.toString()}`, { credentials: "include" });
  if (!r.ok) throw new Error(`comments failed: ${r.status}`);
  return r.json(); // { items: [...], next_cursor: { after_ts, after_id } | null }
}

export async function addComment(postid, { body, parentid = null }) {
  const r = await fetch(`${API_BASE}/api/posts/${postid}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ body, parentid }),
  });
  if (!r.ok) {
    const t = await r.text().catch(() => "");
    throw new Error(`create comment failed: ${r.status} ${t}`);
  }
  return r.json(); // created comment
}

// Convenience for your detail screen
export async function getPostWithComments(postid) {
  const r = await fetch(`${API_BASE}/api/posts/${postid}/with-comments`, {
    credentials: "include",
    headers: {
      ...authHeaders(),
    },
  });
  if (!r.ok) throw new Error(`post w/ comments failed: ${r.status}`);
  return r.json();
}
// api.js
export async function getPostLikeState(postid) {
  const r = await fetch(`${API_BASE}/api/posts/${postid}/likes`, { credentials: "include" });
  if (!r.ok) throw new Error(`like state failed: ${r.status}`);
  return r.json(); // { postid, liked, likeCount }
}

export async function updateLikeStatus(postid, like) {
  const r = await fetch(`${API_BASE}/api/posts/${postid}/likes`, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
    },
    body: JSON.stringify({ like }),
  });
  if (!r.ok) throw new Error(`like toggle failed: ${r.status}`);
  return r.json();
}

export async function updateCommentLikeStatus(postid, commentid, like) {
  const r = await fetch(`${API_BASE}/api/posts/${postid}/comments/${commentid}/likes`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify({ like }),
  });
  if (!r.ok) throw new Error(`comment like toggle failed: ${r.status}`);
  return r.json(); // { commentid, liked, likeCount }
}
