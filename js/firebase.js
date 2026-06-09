import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, arrayUnion, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

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
export const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({ prompt: "select_account" });

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

export const RANKS = [
  { id: "Rookie", min: 0, emoji: "🥉" },
  { id: "Warrior", min: 500, emoji: "🥈" },
  { id: "Champion", min: 2000, emoji: "🥇" },
  { id: "Legend", min: 10000, emoji: "👑" },
];

export function getRank(points = 0) {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (points >= RANKS[i].min) return RANKS[i].id;
  }
  return "Rookie";
}

export function getLevel(points = 0) {
  return Math.floor(points / 500) + 1;
}

export { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where, orderBy, limit, onSnapshot, serverTimestamp, arrayUnion, addDoc };
