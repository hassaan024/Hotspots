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

// Posts
export async function listPosts() {
  const r = await fetch(`${API_BASE}/api/posts`);
  if (!r.ok) throw new Error(`Posts failed: ${r.status}`);
  return r.json();
}
export async function createPost(input) {
  const r = await fetch(`${API_BASE}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!r.ok) throw new Error(`Create post failed: ${r.status}`);
  return r.json();
}

// Maps
export async function listLocations() {
  const r = await fetch(`${API_BASE}/api/posts/locations`);
  if (!r.ok) throw new Error(`Locations failed: ${r.status}`);
  return r.json(); // [{ id, postedby, lat, lng, datapath }]
}

