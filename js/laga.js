import { db, COL, serverTimestamp, getRank } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot, orderBy, limit } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";
import { createNotification } from "./notifications.js";

const LAGA_CHALLENGES = [
  "🐍 Ale Wąż",
  "🏃 Gonisz",
  "💪 Burpees",
  "🚴 Rower",
  "🤸 Przysiady",
  "⛹️ Skakanka",
  "🧗 Wspinaczka",
  "🏊 Pływanie",
];

export function getRandomChallenge() {
  return LAGA_CHALLENGES[Math.floor(Math.random() * LAGA_CHALLENGES.length)];
}

export async function sendLagaRequest(fromUid, fromName, toUid, toName) {
  try {
    const challenge = getRandomChallenge();

    await addDoc(collection(db, COL.LAGA_REQUESTS), {
      fromUid,
      fromName,
      toUid,
      toName,
      challenge,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    await createNotification(
      toUid,
      "laga_received",
      `${fromName} wyzwał Cię na lagę! Wyzwanie: ${challenge}`,
      fromUid
    );

    showToast(`✅ Wyzwał ${toName} na lagę!`, "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd wysyłania", "error");
    console.error("Send laga request error:", err);
    return false;
  }
}

export async function acceptLaga(lagaId, uid, userName) {
  try {
    const lagaSnap = await getDoc(doc(db, COL.LAGA_REQUESTS, lagaId));
    if (!lagaSnap.exists()) {
      showToast("❌ Laga nie istnieje", "error");
      return false;
    }

    const lagaData = lagaSnap.data();

    await updateDoc(doc(db, COL.LAGA_REQUESTS, lagaId), { status: "accepted" });

    await createNotification(
      lagaData.fromUid,
      "laga_accepted",
      `${userName} zaakceptował Twoją lagę!`,
      uid
    );

    showToast("✅ Zaakceptowałeś lagę!", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd akceptacji", "error");
    console.error("Accept laga error:", err);
    return false;
  }
}

export async function completeLaga(lagaId, uid, userName) {
  try {
    const lagaSnap = await getDoc(doc(db, COL.LAGA_REQUESTS, lagaId));
    if (!lagaSnap.exists()) {
      showToast("❌ Laga nie istnieje", "error");
      return false;
    }

    const lagaData = lagaSnap.data();

    await updateDoc(doc(db, COL.LAGA_REQUESTS, lagaId), { status: "completed" });

    const userSnap = await getDoc(doc(db, COL.USERS, uid));
    const currentPoints = userSnap.data().points || 0;

    await updateDoc(doc(db, COL.USERS, uid), {
      points: currentPoints + 50,
      streak: (userSnap.data().streak || 0) + 1,
    });

    await createNotification(
      lagaData.fromUid,
      "laga_completed",
      `${userName} wykonał Waszą lagę!`,
      uid
    );

    showToast("✅ Laga ukończona! +50 XP", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd ukończenia", "error");
    console.error("Complete laga error:", err);
    return false;
  }
}

export async function rejectLaga(lagaId) {
  try {
    await updateDoc(doc(db, COL.LAGA_REQUESTS, lagaId), { status: "rejected" });
    showToast("✅ Odrzucono lagę", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd odrzucenia", "error");
    console.error("Reject laga error:", err);
    return false;
  }
}

export function loadLagaRequests(uid, callback) {
  const q = query(
    collection(db, COL.LAGA_REQUESTS),
    where("toUid", "==", uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const requests = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(requests);
  });
}

export async function getLagaRanking() {
  try {
    const q = query(
      collection(db, COL.USERS),
      orderBy("streak", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Get laga ranking error:", err);
    return [];
  }
}
