import { db, COL } from "./firebase.js";
import { doc, updateDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";

export async function loadProfile(user, userData) {
  if (!user || !userData) {
    window.location.href = "login.html";
    return;
  }

  document.getElementById("profile-name").textContent = userData.displayName || "Wojownik";
  document.getElementById("profile-username").textContent = "@" + (userData.username || user.email.split("@")[0]);
  document.getElementById("stat-level").textContent = userData.level || 1;
  document.getElementById("stat-xp").textContent = userData.points || 0;
  document.getElementById("stat-rank").textContent = userData.rank || "Rookie";

  const avatar = (userData.displayName || "W").charAt(0).toUpperCase();
  document.getElementById("profile-avatar").textContent = avatar;

  if (document.getElementById("profile-bio")) {
    document.getElementById("profile-bio").value = userData.bio || "";
  }

  const achievementsContainer = document.getElementById("achievements-list");
  if (achievementsContainer) {
    const achievements = ["🏅", "⭐", "🎖️", "🏆", "💎", "🔥", "⚔️", "👑"];
    achievementsContainer.innerHTML = achievements.map((a) => `<div style="font-size: 32px; text-align: center;">${a}</div>`).join("");
  }

  const saveBioBtn = document.getElementById("save-bio-btn");
  if (saveBioBtn) {
    saveBioBtn.addEventListener("click", async () => {
      const bio = document.getElementById("profile-bio").value;
      try {
        await updateDoc(doc(db, COL.USERS, user.uid), { bio });
        showToast("✅ Bio zaktualizowane", "success");
      } catch (err) {
        showToast("❌ Błąd aktualizacji", "error");
        console.error("Update bio error:", err);
      }
    });
  }
}

export async function updateUserProfile(uid, updates) {
  try {
    await updateDoc(doc(db, COL.USERS, uid), updates);
    showToast("✅ Profil zaktualizowany", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd aktualizacji", "error");
    console.error("Update profile error:", err);
    return false;
  }
}

export async function getUserProfile(uid) {
  try {
    const snap = await getDoc(doc(db, COL.USERS, uid));
    return snap.exists() ? snap.data() : null;
  } catch (err) {
    console.error("Get profile error:", err);
    return null;
  }
}
