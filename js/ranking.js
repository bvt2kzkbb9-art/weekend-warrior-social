import { db, COL } from "./firebase.js";
import { query, orderBy, limit, getDocs, collection } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export async function getRanking(sortBy = "points", limitCount = 100) {
  try {
    const q = query(
      collection(db, COL.USERS),
      orderBy(sortBy, "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc, idx) => ({
      position: idx + 1,
      uid: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Get ranking error:", err);
    return [];
  }
}

export async function getWeeklyRanking() {
  try {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const q = query(collection(db, COL.USERS), orderBy("points", "desc"), limit(50));
    const snap = await getDocs(q);

    return snap.docs.map((doc, idx) => ({
      position: idx + 1,
      uid: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Get weekly ranking error:", err);
    return [];
  }
}

export async function getUserPosition(uid, sortBy = "points") {
  try {
    const q = query(collection(db, COL.USERS), orderBy(sortBy, "desc"));
    const snap = await getDocs(q);

    let position = 0;
    snap.docs.forEach((doc, idx) => {
      if (doc.id === uid) {
        position = idx + 1;
      }
    });

    return position;
  } catch (err) {
    console.error("Get user position error:", err);
    return 0;
  }
}
