import { db, COL, serverTimestamp, arrayUnion } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, getDoc, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";

export async function createConversation(participants) {
  try {
    const sorted = participants.sort();
    const existingQ = query(
      collection(db, COL.CONVERSATIONS),
      where("participants", "==", sorted)
    );
    const existing = await getDocs(existingQ);
    if (!existing.empty) {
      return existing.docs[0].id;
    }

    const docRef = await addDoc(collection(db, COL.CONVERSATIONS), {
      participants: sorted,
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (err) {
    console.error("Create conversation error:", err);
    return null;
  }
}

export async function sendMessage(conversationId, senderId, senderName, content, imageUrl = "") {
  try {
    const msgRef = await addDoc(collection(db, COL.CONVERSATIONS, conversationId, COL.MESSAGES), {
      senderId,
      senderName,
      content,
      imageUrl,
      read: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(doc(db, COL.CONVERSATIONS, conversationId), {
      lastMessage: content.substring(0, 50),
      lastMessageAt: serverTimestamp(),
    });

    return msgRef.id;
  } catch (err) {
    showToast("❌ Błąd wysyłania wiadomości", "error");
    console.error("Send message error:", err);
    return null;
  }
}

export function loadMessages(conversationId, callback) {
  const q = query(
    collection(db, COL.CONVERSATIONS, conversationId, COL.MESSAGES),
    orderBy("createdAt", "asc"),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const messages = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(messages);
  });
}

export function loadConversations(uid, callback) {
  const q = query(
    collection(db, COL.CONVERSATIONS),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const conversations = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(conversations);
  });
}

export async function markMessagesAsRead(conversationId, userId) {
  try {
    const q = query(
      collection(db, COL.CONVERSATIONS, conversationId, COL.MESSAGES),
      where("senderId", "!=", userId),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    snap.docs.forEach((docSnap) => {
      updateDoc(docSnap.ref, { read: true });
    });
  } catch (err) {
    console.error("Mark messages as read error:", err);
  }
}

export async function getConversationOtherUser(conversationId, currentUid) {
  try {
    const snap = await getDoc(doc(db, COL.CONVERSATIONS, conversationId));
    if (!snap.exists()) return null;

    const data = snap.data();
    const otherUid = data.participants.find((uid) => uid !== currentUid);
    if (!otherUid) return null;

    const userSnap = await getDoc(doc(db, COL.USERS, otherUid));
    return userSnap.exists() ? { uid: otherUid, ...userSnap.data() } : null;
  } catch (err) {
    console.error("Get conversation other user error:", err);
    return null;
  }
}
