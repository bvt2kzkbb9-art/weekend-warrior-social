/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — firebase.js (CORE)
 * Firebase SDK 10.12.2 | ES Modules | App + Auth + Firestore
 * ============================================================
 *
 * KONTRAKT API (używany przez WSZYSTKIE strony — nie zmieniać sygnatur):
 *   auth, db, googleProvider, COL
 *   RANKS                  — [{ id, label, min, emoji }]
 *   getRank(points)        — zwraca OBIEKT rangi { id, label, min, emoji }
 *   getRankId(points)      — zwraca string id rangi
 *   getLevel(points)       — number
 *   getRankProgress(points)— % postępu do następnej rangi (0–100)
 *   uploadImage(file, path, onProgress) — upload do Cloudinary → URL
 *   deleteImageByURL(url)  — Cloudinary auto-cleanup
 *   compressImage(file)    — zmniejsza zdjęcie przed uploadem (max 1280px)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove, addDoc, increment, writeBatch, documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
  apiKey: "AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98",
  authDomain: "weekend-warrior-social-ed3d0.firebaseapp.com",
  projectId: "weekend-warrior-social-ed3d0",
  messagingSenderId: "487311448505",
  appId: "1:487311448505:web:ffbe035b92efa8fc193e68",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

// ── Kolekcje ─────────────────────────────────────────────────
export const COL = {
  USERS: "users",
  POSTS: "posts",
  COMMENTS: "comments",
  FOLLOWERS: "followers",
  FRIEND_REQUESTS: "friend_requests",
  FRIENDS: "friends",
  CONVERSATIONS: "conversations",
  MESSAGES: "messages",
  NOTIFICATIONS: "notifications",
  CHALLENGE_INVITES: "challenge_invites",
  CHALLENGES: "challenges",
  LAGA_REQUESTS: "laga_requests",
  ACHIEVEMENTS: "achievements",
  USER_ACHIEVEMENTS: "userAchievements",
};

// ── Rangi ────────────────────────────────────────────────────
// UWAGA: getRank() zwraca OBIEKT (strony używają rankObj.emoji / .label / .min / .id)
export const RANKS = [
  { id: "Rookie",   label: "Rookie",   min: 0,     emoji: "🥉" },
  { id: "Warrior",  label: "Warrior",  min: 500,   emoji: "🥈" },
  { id: "Champion", label: "Champion", min: 2000,  emoji: "🥇" },
  { id: "Legend",   label: "Legend",   min: 10000, emoji: "👑" },
];

export function getRank(points = 0) {
  const p = Number(points) || 0;
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (p >= RANKS[i].min) return RANKS[i];
  }
  return RANKS[0];
}

export function getRankId(points = 0) {
  return getRank(points).id;
}

export function getLevel(points = 0) {
  return Math.floor((Number(points) || 0) / 500) + 1;
}

/** % postępu do następnej rangi (0–100). Dla Legend → 100. */
export function getRankProgress(points = 0) {
  const p = Number(points) || 0;
  const cur = getRank(p);
  const idx = RANKS.findIndex(r => r.id === cur.id);
  const next = RANKS[idx + 1];
  if (!next) return 100;
  const span = next.min - cur.min;
  return Math.max(0, Math.min(100, Math.round(((p - cur.min) / span) * 100)));
}

// ════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════

/**
 * Kompresuje obraz w przeglądarce (max 1280px, JPEG q=0.85).
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxDim = 1280, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file); return; // GIF-y zostawiamy (animacja)
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
      if (width <= maxDim && height <= maxDim && file.size < 600 * 1024) { resolve(file); return; }
      const scale = Math.min(1, maxDim / Math.max(width, height));
      width = Math.round(width * scale);
      height = Math.round(height * scale);
      const canvas = document.createElement('canvas');
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(b => resolve(b || file), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

/**
 * @param {File|Blob} file
 * @param {string} path        — np. `posts/${uid}/${Date.now()}.jpg`
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<string>}  — downloadURL
 */
export async function uploadImage(file, path, onProgress) {
  if (!file || !file.type.startsWith('image/')) throw new Error('Nie jest obrazem');
  
  // Określ upload_preset na podstawie path
  let uploadPreset = 'wws_avatar';
  if (path.includes('banner')) uploadPreset = 'wws_banner';
  
  const compressed = await compressImage(file);
  const formData = new FormData();
  formData.append('file', compressed);
  formData.append('upload_preset', uploadPreset);
  formData.append('cloud_name', 'dxanfwb3l');
  
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress?.(pct);
      }
    });
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText);
          res(data.secure_url || data.url);
        } catch (e) { rej(e); }
      } else {
        rej(new Error(`Błąd uploadu: ${xhr.status}`));
      }
    });
    xhr.addEventListener('error', () => rej(new Error('Błąd sieci')));
    xhr.open('POST', 'https://api.cloudinary.com/v1_1/dxanfwb3l/image/upload');
    xhr.send(formData);
  });
}

/** Cloudinary auto-usuwa nieużywane pliki, więc delete jest opcjonalny. */
export async function deleteImageByURL(url) {
  console.log('[deleteImageByURL] Cloudinary obsługuje auto-cleanup');
}

// ── Re-export Firestore API (strony importują stąd) ─────────
export {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove, addDoc, increment, writeBatch, documentId,
};
