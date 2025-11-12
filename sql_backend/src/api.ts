const BASE = import.meta.env.VITE_API_URL;
//These are backend helpers
export async function listUsers() {
  const r = await fetch(`${BASE}/api/users`, { credentials: "include" });
  if (!r.ok) throw new Error(`Users failed: ${r.status}`); 
  return r.json();
}

export async function getUser(username: string) {
  const r = await fetch(`${BASE}/api/users/${encodeURIComponent(username)}`, { credentials: "include" });
  if (!r.ok) throw new Error(`User not found: ${r.status}`);
  return r.json();
}
export async function createUser(input: { username: string; email: string; password: string }) {
  const r = await fetch(`${BASE}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`Create user failed: ${r.status}`);
  return r.json();
}
export async function listPosts() {
  const r = await fetch(`${BASE}/api/posts`, { credentials: "include" });
  if (!r.ok) throw new Error(`Posts failed: ${r.status}`);
  return r.json();
}
export async function getPost(postid: number) {
  const r = await fetch(`${BASE}/api/posts/${postid}`, { credentials: "include" });
  if (!r.ok) throw new Error(`Post not found: ${r.status}`);
  return r.json();
}
export async function createPost(input: {
  postedby: string; posttype: number; datapath: string; location: string; visibility?: number | null;
}) {
  const r = await fetch(`${BASE}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!r.ok) throw new Error(`Create post failed: ${r.status}`);
  return r.json();
}
export async function deletePost(postid: number) {
  const r = await fetch(`${BASE}/api/posts/${postid}`, { method: "DELETE", credentials: "include" });
  if (!r.ok) throw new Error(`Delete post failed: ${r.status}`);
}
