import { db, COL, serverTimestamp, arrayUnion } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, deleteDoc, getDoc, onSnapshot, orderBy } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";

export async function sendFriendRequest(fromUid, fromName, toUid) {
  try {
    await addDoc(collection(db, COL.FRIEND_REQUESTS), {
      senderId: fromUid,
      senderName: fromName,
      receiverId: toUid,
      status: "pending",
      createdAt: serverTimestamp(),
    });
    showToast("✅ Zaproszenie wysłane", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd wysyłania zaproszenia", "error");
    console.error("Send friend request error:", err);
    return false;
  }
}

export async function acceptFriendRequest(requestId, uid1, uid2) {
  try {
    await updateDoc(doc(db, COL.FRIEND_REQUESTS, requestId), { status: "accepted" });

    await addDoc(collection(db, COL.FRIENDS), {
      uid1,
      uid2,
      createdAt: serverTimestamp(),
    });

    showToast("✅ Zaproszenie zaakceptowane", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd akceptacji", "error");
    console.error("Accept friend request error:", err);
    return false;
  }
}

export async function rejectFriendRequest(requestId) {
  try {
    await updateDoc(doc(db, COL.FRIEND_REQUESTS, requestId), { status: "rejected" });
    showToast("✅ Zaproszenie odrzucone", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd odrzucenia", "error");
    console.error("Reject friend request error:", err);
    return false;
  }
}

export async function removeFriend(uid1, uid2) {
  try {
    const q = query(
      collection(db, COL.FRIENDS),
      where("uid1", "==", uid1),
      where("uid2", "==", uid2)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      await deleteDoc(snap.docs[0].ref);
    } else {
      const q2 = query(
        collection(db, COL.FRIENDS),
        where("uid1", "==", uid2),
        where("uid2", "==", uid1)
      );
      const snap2 = await getDocs(q2);
      if (!snap2.empty) {
        await deleteDoc(snap2.docs[0].ref);
      }
    }
    showToast("✅ Usunięto znajomego", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd usuwania", "error");
    console.error("Remove friend error:", err);
    return false;
  }
}

export async function getFriendRequests(uid) {
  try {
    const q = query(
      collection(db, COL.FRIEND_REQUESTS),
      where("receiverId", "==", uid),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Get friend requests error:", err);
    return [];
  }
}

export async function getFriends(uid) {
  try {
    const q = query(
      collection(db, COL.FRIENDS),
      where("uid1", "==", uid)
    );
    const snap = await getDocs(q);
    const friends = snap.docs.map((doc) => doc.data().uid2);

    const q2 = query(
      collection(db, COL.FRIENDS),
      where("uid2", "==", uid)
    );
    const snap2 = await getDocs(q2);
    const friends2 = snap2.docs.map((doc) => doc.data().uid1);

    return [...friends, ...friends2];
  } catch (err) {
    console.error("Get friends error:", err);
    return [];
  }
}

export function loadFriendsRealtime(uid, callback) {
  const q = query(collection(db, COL.FRIENDS), where("uid1", "==", uid));
  return onSnapshot(q, (snap) => {
    const friends = snap.docs.map((doc) => doc.data().uid2);
    callback(friends);
  });
}
