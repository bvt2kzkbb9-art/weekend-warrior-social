import { auth, db, getRank, getLevel, getRankProgress } from './firebase.js';

import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

let currentUser = null;
let currentProfile = null;

// ======================================================
// AUTH
// ======================================================

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace('login.html');
    return;
  }

  currentUser = user;

  await loadProfile();
  await updateLastActive();
});

// ======================================================
// PROFILE LOADING
// ======================================================

export async function loadProfile() {
  try {
    const profileRef = doc(db, 'users', currentUser.uid);
    const profileSnap = await getDoc(profileRef);

    if (!profileSnap.exists()) {
      console.error('Nie znaleziono profilu.');
      return;
    }

    currentProfile = profileSnap.data();

    renderProfile(currentProfile);
    } catch (error) {
  console.error('PROFILE ERROR');
  console.error(error);
  console.error(error.code);
  console.error(error.message);

  alert(error.message);
}
  
}

// ======================================================
// RENDER PROFILE
// ======================================================

function renderProfile(data) {
  const points = data.points || 0;

  const rank = getRank(points);
  const level = getLevel(points);
  const progress = getRankProgress(points);

  // Avatar
  renderAvatar(data);

  // Dane podstawowe
  setText('displayName', data.displayName || 'Wojownik');
  setText('email', data.email || '');
  setText('rankName', rank.label);
  setText('rankEmoji', rank.emoji);

  setText('levelText', `Poziom ${level}`);

  // Statystyki
  setText('points', points);
  setText('level', level);

  setText('postsCount', data.postsCount || 0);
  setText('followersCount', data.followersCount || 0);
  setText('followingCount', data.followingCount || 0);
  setText('achievementsCount', data.achievementsCount || 0);

  // Bio
  setText(
    'bio',
    data.bio?.trim()
      ? data.bio
      : 'Brak opisu użytkownika.'
  );

  // Lokalizacja
  setText(
    'location',
    data.location?.trim()
      ? data.location
      : 'Nie podano lokalizacji.'
  );

  // Pasek postępu
  const xpFill = document.getElementById('xpFill');
  if (xpFill) {
    xpFill.style.width = `${progress}%`;
  }

  setText(
    'progressText',
    `${progress}% do kolejnej rangi`
  );

  // Formularz
  fillEditForm(data);
}

// ======================================================
// AVATAR
// ======================================================

function renderAvatar(data) {
  const avatar = document.getElementById('avatar');

  if (!avatar) return;

  const photoURL = data.photoURL || '';

  if (photoURL) {
    avatar.innerHTML = `
      <img
        src="${photoURL}"
        alt="Avatar"
      />
    `;
    return;
  }

  const firstLetter =
    (data.displayName || 'W')
      .charAt(0)
      .toUpperCase();

  avatar.textContent = firstLetter;
}

// ======================================================
// EDIT FORM
// ======================================================

function fillEditForm(data) {
  const displayNameInput =
    document.getElementById('editDisplayName');

  const bioInput =
    document.getElementById('editBio');

  const locationInput =
    document.getElementById('editLocation');

  if (displayNameInput)
    displayNameInput.value =
      data.displayName || '';

  if (bioInput)
    bioInput.value =
      data.bio || '';

  if (locationInput)
    locationInput.value =
      data.location || '';
}

// ======================================================
// SAVE PROFILE
// ======================================================

export async function saveProfile(event) {
  event.preventDefault();

  try {
    const displayName =
      document
        .getElementById('editDisplayName')
        .value
        .trim();

    const bio =
      document
        .getElementById('editBio')
        .value
        .trim();

    const location =
      document
        .getElementById('editLocation')
        .value
        .trim();

    const profileRef =
      doc(db, 'users', currentUser.uid);

    await updateDoc(profileRef, {
      displayName,
      bio,
      location,
      lastActive: serverTimestamp()
    });

    closeModal();

    await loadProfile();

    alert('Profil zapisany.');
  } catch (error) {
    console.error(error);
    alert('Błąd podczas zapisu.');
  }
}

// ======================================================
// LAST ACTIVE
// ======================================================

export async function updateLastActive() {
  try {
    const profileRef =
      doc(db, 'users', currentUser.uid);

    await updateDoc(profileRef, {
      lastActive: serverTimestamp()
    });
  } catch (error) {
    console.error(error);
  }
}

// ======================================================
// MODAL
// ======================================================

const modal =
  document.getElementById('editModal');

const editBtn =
  document.getElementById('editProfileBtn');

const closeBtn =
  document.getElementById('closeModal');

const profileForm =
  document.getElementById('profileForm');

function openModal() {
  modal?.classList.add('active');
}

function closeModal() {
  modal?.classList.remove('active');
}

editBtn?.addEventListener('click', openModal);

closeBtn?.addEventListener('click', closeModal);

modal?.addEventListener('click', (e) => {
  if (e.target === modal) {
    closeModal();
  }
});

profileForm?.addEventListener(
  'submit',
  saveProfile
);

// ======================================================
// HELPERS
// ======================================================

function setText(id, value) {
  const element = document.getElementById(id);

  if (!element) return;

  element.textContent = value;
}
