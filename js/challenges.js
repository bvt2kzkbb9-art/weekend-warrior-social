import { db, COL, serverTimestamp, getRank, getLevel } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot, orderBy, limit, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";
import { createNotification } from "./notifications.js";

const CHALLENGES_DATA = [
  { id: "ale-waz", icon: "🐍", name: "Ale Wąż", xp: 25, description: "Wyląduj ile możesz razy" },
  { id: "gonisz", icon: "🏃", name: "Gonisz", xp: 25, description: "Pobiegaj 5km" },
  { id: "burpees", icon: "💪", name: "Burpees", xp: 20, description: "Zrób 50 burpees" },
  { id: "rower", icon: "🚴", name: "Rower", xp: 25, description: "Jeżdź 20km" },
  { id: "przysiady", icon: "🤸", name: "Przysiady", xp: 15, description: "Zrób 100 przysiadów" },
  { id: "skakanka", icon: "⛹️", name: "Skakanka", xp: 20, description: "Skakaj 500 razy" },
  { id: "wspinaczka", icon: "🧗", name: "Wspinaczka", xp: 30, description: "Wejdź 10 pięter" },
  { id: "plywanie", icon: "🏊", name: "Pływanie", xp: 25, description: "Pływaj 1km" },
];

export function getChallengeData(id) {
  return CHALLENGES_DATA.find((c) => c.id === id) || null;
}

export async function sendChallenge(fromUid, fromName, toUid, toName, challengeId) {
  try {
    const challenge = getChallengeData(challengeId);
    if (!challenge) {
      showToast("❌ Wyzwanie nie istnieje", "error");
      return false;
    }

    await addDoc(collection(db, COL.CHALLENGE_INVITES), {
      fromUid,
      fromName,
      toUid,
      toName,
      challengeId,
      challengeName: challenge.name,
      challengeIcon: challenge.icon,
      xp: challenge.xp,
      status: "pending",
      createdAt: serverTimestamp(),
    });

    await createNotification(
      toUid,
      "challenge_received",
      `${fromName} wysłał Ci wyzwanie: ${challenge.name}`,
      fromUid,
      { challengeId, challengeName: challenge.name }
    );

    showToast(`✅ Wyzwanie wysłane do ${toName}`, "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd wysyłania wyzwania", "error");
    console.error("Send challenge error:", err);
    return false;
  }
}

export async function acceptChallenge(inviteId, uid, userName) {
  try {
    const inviteSnap = await getDoc(doc(db, COL.CHALLENGE_INVITES, inviteId));
    if (!inviteSnap.exists()) {
      showToast("❌ Wyzwanie nie istnieje", "error");
      return false;
    }

    const inviteData = inviteSnap.data();

    await updateDoc(doc(db, COL.CHALLENGE_INVITES, inviteId), { status: "accepted" });

    await addDoc(collection(db, COL.CHALLENGES), {
      fromUid: inviteData.fromUid,
      fromName: inviteData.fromName,
      toUid: inviteData.toUid,
      toName: inviteData.toName,
      challengeId: inviteData.challengeId,
      challengeName: inviteData.challengeName,
      xp: inviteData.xp,
      status: "in-progress",
      createdAt: serverTimestamp(),
      completedAt: null,
      completedBy: null,
    });

    await createNotification(
      inviteData.fromUid,
      "challenge_accepted",
      `${userName} zaakceptował Twoje wyzwanie`,
      uid
    );

    showToast("✅ Wyzwanie zaakceptowane", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd akceptacji", "error");
    console.error("Accept challenge error:", err);
    return false;
  }
}

export async function completeChallenge(challengeId, uid, userName) {
  try {
    const challengeSnap = await getDoc(doc(db, COL.CHALLENGES, challengeId));
    if (!challengeSnap.exists()) {
      showToast("❌ Wyzwanie nie istnieje", "error");
      return false;
    }

    const challengeData = challengeSnap.data();

    await updateDoc(doc(db, COL.CHALLENGES, challengeId), {
      status: "completed",
      completedAt: serverTimestamp(),
      completedBy: uid,
    });

    await updateDoc(doc(db, COL.USERS, uid), {
      points: (await getDoc(doc(db, COL.USERS, uid))).data().points + challengeData.xp || challengeData.xp,
    });

    await createNotification(
      challengeData.fromUid,
      "challenge_completed",
      `${userName} ukończył wyzwanie: ${challengeData.challengeName}`,
      uid,
      { xp: challengeData.xp }
    );

    showToast(`✅ Wyzwanie ukończone! +${challengeData.xp} XP`, "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd ukończenia", "error");
    console.error("Complete challenge error:", err);
    return false;
  }
}

export async function rejectChallenge(inviteId) {
  try {
    await updateDoc(doc(db, COL.CHALLENGE_INVITES, inviteId), { status: "rejected" });
    showToast("✅ Wyzwanie odrzucone", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd odrzucenia", "error");
    console.error("Reject challenge error:", err);
    return false;
  }
}

export function loadChallenges(uid, callback) {
  const q = query(
    collection(db, COL.CHALLENGES),
    where("toUid", "==", uid),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const challenges = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(challenges);
  });
}

export function loadChallengeInvites(uid, callback) {
  const q = query(
    collection(db, COL.CHALLENGE_INVITES),
    where("toUid", "==", uid),
    where("status", "==", "pending"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const invites = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(invites);
  });
}
