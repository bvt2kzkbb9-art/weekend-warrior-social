import { db, COL, serverTimestamp } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, onSnapshot, orderBy, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function createNotification(toUid, type, message, relatedUid = "", relatedData = {}) {
  try {
    await addDoc(collection(db, COL.NOTIFICATIONS, toUid, "items"), {
      type,
      message,
      relatedUid,
      relatedData,
      read: false,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (err) {
    console.error("Create notification error:", err);
    return false;
  }
}

export function loadNotifications(uid, callback) {
  const q = query(
    collection(db, COL.NOTIFICATIONS, uid, "items"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const notifications = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(notifications);
  });
}

export async function markNotificationAsRead(uid, notifId) {
  try {
    await updateDoc(doc(db, COL.NOTIFICATIONS, uid, "items", notifId), { read: true });
  } catch (err) {
    console.error("Mark notification as read error:", err);
  }
}

export async function deleteNotification(uid, notifId) {
  try {
    await deleteDoc(doc(db, COL.NOTIFICATIONS, uid, "items", notifId));
  } catch (err) {
    console.error("Delete notification error:", err);
  }
}

export async function getUnreadCount(uid) {
  try {
    const q = query(
      collection(db, COL.NOTIFICATIONS, uid, "items"),
      where("read", "==", false)
    );
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.error("Get unread count error:", err);
    return 0;
  }
}
