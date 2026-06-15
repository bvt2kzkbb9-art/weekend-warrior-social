/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — firebase.js (CORE)
 * Firebase SDK 10.12.2 | ES Modules | App + Auth + Firestore + Storage
 * ============================================================
 *
 * KONTRAKT API (używany przez WSZYSTKIE strony — nie zmieniać sygnatur):
 *   auth, db, storage, googleProvider, COL
 *   RANKS                  — [{ id, label, min, emoji }]
 *   getRank(points)        — zwraca OBIEKT rangi { id, label, min, emoji }
 *   getRankId(points)      — zwraca string id rangi
 *   getLevel(points)       — number
 *   getRankProgress(points)— % postępu do następnej rangi (0–100)
 *   uploadImage(file, path, onProgress) — upload do Firebase Storage → URL
 *   deleteImageByURL(url)  — usuwa plik ze Storage po jego URL
 *   compressImage(file)    — zmniejsza zdjęcie przed uploadem (oszczędza quota)
 */

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import {
  getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove, addDoc, increment, writeBatch, documentId,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
// ❌ Usunięto: Firebase Storage (używamy Cloudinary zamiast)

const firebaseConfig = {
  apiKey: "AIzaSyA9I-uUmWLLjq8WNrAgnlmXQxiAgRR1U98",
  authDomain: "weekend-warrior-social-ed3d0.firebaseapp.com",
  projectId: "weekend-warrior-social-ed3d0",
  storageBucket: "weekend-warrior-social-ed3d0.firebasestorage.app",
  messagingSenderId: "487311448505",
  appId: "1:487311448505:web:ffbe035b92efa8fc193e68",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
// ❌ storage usunięty - używamy Cloudinary
export const googleProvider = new GoogleAuthProvider();

// ════════════════════════════════════════════════════════════
// CLOUDINARY CONFIGURATION
// ════════════════════════════════════════════════════════════
export const CLOUDINARY_CLOUD_NAME = "your-cloud-name-xxxxx";  // ← ZMIEŃ NA SWOJĄ
export const CLOUDINARY_UPLOAD_PRESET = "weekend-warrior-social";

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
// CLOUDINARY UPLOAD - Image Storage
// ════════════════════════════════════════════════════════════

/**
 * Kompresuje obraz w przeglądarce (max 1280px, JPEG q=0.85).
 * @param {File} file
 * @returns {Promise<Blob>}
 */
export function compressImage(file, maxDim = 1280, quality = 0.85) {
  return new Promise((resolve) => {
    if (!file || !file.type.startsWith('image/') || file.type === 'image/gif') {
      resolve(file); return;
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
 * Upload pliku na Cloudinary CDN
 * @param {File|Blob} file
 * @param {string} folder - 'posts', 'profiles', lub 'messages'
 * @param {(pct:number)=>void} [onProgress]
 * @returns {Promise<string>} - Cloudinary secure URL
 */
export async function uploadImage(file, folder = 'posts', onProgress) {
  if (!file || !file.type.startsWith('image/')) {
    throw new Error('Plik musi być obrazem');
  }

  if (file.size > 8 * 1024 * 1024) {
    throw new Error('Obraz nie może być większy niż 8 MB');
  }

  const blob = await compressImage(file);

  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', `weekend-warrior-social/${folder}`);
    formData.append('resource_type', 'auto');

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percent = Math.round((e.loaded / e.total) * 100);
        if (onProgress) onProgress(percent);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.secure_url);
        } catch (e) {
          reject(new Error('Błąd parsowania odpowiedzi Cloudinary'));
        }
      } else {
        reject(new Error(`Błąd uploadu: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Błąd połączenia z Cloudinary'));
    });

    xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`);
    xhr.send(formData);
  });
}

/** Cloudinary obsługuje usuwanie z dashboarda. Cicho ignorujemy. */
export async function deleteImageByURL(url) {
  // Cloudinary: usuń manualnie z dashboarda lub czekaj na auto-delete
  console.log('[deleteImageByURL] Image deletion not implemented for Cloudinary');
}

// ── Re-export Firestore API (strony importują stąd) ─────────
export {
  collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, limit, startAfter, onSnapshot, serverTimestamp,
  arrayUnion, arrayRemove, addDoc, increment, writeBatch, documentId,
};
