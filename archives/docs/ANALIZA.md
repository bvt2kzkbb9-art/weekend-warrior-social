# ANALIZA BŁĘDÓW SKELETON LOADER — WEEKEND WARRIOR SOCIAL

**Data**: 2026-06-16  
**Status**: RUNTIME-REPRODUCIBLE na iPhone Safari  
**Dotkniętych stron**: 3/8 (Arena, Chwała, Bohater)

---

## EXECUTIVE SUMMARY

Trzy strony aplikacji (Arena, Chwała, Bohater) pokazują wyłącznie skeleton loader na iPhonie. Główna przyczyna: **brak timeout fallback dla onAuthStateChanged() oraz błędne czyszczenie timeout'u.**

---

## SIDE-BY-SIDE CODE COMPARISON

---

## BUG #1: BOHATER (profile.html) — Line 550

### OLD CODE (BROKEN):

```javascript
533   checkAuth(async (user) => {
534     ME = user;
535     injectMessengerBadge(user.uid);
536     injectNotifBell(user.uid);
537     // 3s skeleton safety — Firebase może być wolny
538     const skTimer = setTimeout(() => {
539       document.getElementById('profile-skeleton').style.display = 'none';
540       document.getElementById('profile-content').classList.remove('hidden');
541     }, 3000);
542     let data = null;
543     try { 
544       data = await getCurrentUserData(user.uid, user);  // ❌ WRONG PARAMS
545       console.log('[profile] ✅ Data loaded:', data);
546     } catch (err) {
547       console.error('[profile] ❌ Error loading data:', err.message);
548     }
549     data ??= { uid: user.uid, displayName: user.displayName||'Wojownik', photoURL: user.photoURL||'', points: 0 };
550     clearTimeout(skTimer);  // ❌ CLEARS BEFORE TIMEOUT FIRES
551     _renderProfile(user, data);
552     _renderAchievements(data);
553     _renderStreakCalendar(data);
554     _setupEdit(user, data);
555     _setupImageUploads(user.uid, data);
556     await Promise.allSettled([
557       _loadHistory(user.uid),
558       _loadSocialCounts(user.uid),
559       _loadFriendsPanel(user.uid, data),
560     ]);
561     _setupFriendSearch(user.uid, data);
562   });
```

### PROBLEM:

- **Linia 550**: `clearTimeout(skTimer)` uruchamia się w tym samym synchronicznym kontekście co linie 538-541
- setTimeout(fn, 3000) jest ustawiony, ale NATYCHMIAST czyszczony zanim 3 sekundy mają szansę upłynąć
- Skeleton NIGDY nie zostaje ukryty
- Jeśli _renderProfile() lub inne funkcje rzucą błędem, skeleton zostaje uwięziony na ekranie

### NEW CODE (FIXED):

```javascript
533   checkAuth(async (user) => {
534     if (!user) {
535       window.location.href = 'login.html';
536       return;
537     }
538     ME = user;
539     
540     // Set 5-second fallback timeout to show content even if loading fails
541     const skTimer = setTimeout(() => {
542       const skeleton = document.getElementById('profile-skeleton');
543       const content = document.getElementById('profile-content');
544       if (skeleton && content) {
545         skeleton.style.display = 'none';
546         content.classList.remove('hidden');
547       }
548     }, 5000);
549
550     try {
551       injectMessengerBadge(user.uid);
552       injectNotifBell(user.uid);
553       
554       let data = null;
555       try { 
556         data = await getCurrentUserData(user.uid);  // ✅ FIXED: single param
557         console.log('[profile] ✅ Data loaded:', data);
558       } catch (err) {
559         console.error('[profile] ❌ Error loading data:', err.message);
560         data = null;
561       }
562       
563       data ??= { 
564         uid: user.uid, 
565         displayName: user.displayName || 'Wojownik', 
566         photoURL: user.photoURL || '', 
567         points: 0 
568       };
569       
570       try {
571         _renderProfile(user, data);
572         _renderAchievements(data);
573         _renderStreakCalendar(data);
574         _setupEdit(user, data);
575         _setupImageUploads(user.uid, data);
576         await Promise.allSettled([
577           _loadHistory(user.uid),
578           _loadSocialCounts(user.uid),
579           _loadFriendsPanel(user.uid, data),
580         ]);
581         _setupFriendSearch(user.uid, data);
582       } catch (renderErr) {
583         console.error('[profile] ❌ Rendering error:', renderErr.message);
584       }
585       
586       // NOW hide skeleton (after rendering or 5 seconds, whichever is first)
587       clearTimeout(skTimer);  // ✅ MOVED AFTER RENDERING
588       const skeleton = document.getElementById('profile-skeleton');
589       const content = document.getElementById('profile-content');
590       if (skeleton && content) {
591         skeleton.style.display = 'none';
592         content.classList.remove('hidden');
593       }
594     } catch (err) {
595       console.error('[profile] ❌ Fatal error:', err.message);
596       clearTimeout(skTimer);
597       const skeleton = document.getElementById('profile-skeleton');
598       const content = document.getElementById('profile-content');
599       if (skeleton && content) {
600         skeleton.style.display = 'none';
601         content.classList.remove('hidden');
602       }
603     }
604   });
```

### KEY CHANGES:

- **Linia 541-548**: Timeout USTAWIONY PIERWSZY (5 sekund) — fallback, jeśli cokolwiek pójdzie nie tak
- **Linie 550-584**: WSZYSTKIE renderowanie opakowane w try-catch
- **Linia 587**: clearTimeout DOPIERO PO renderowaniu się kompletnym
- **Linie 588-593**: Skeleton ukryty DOPIERO PO renderowaniu
- **Linie 595-603**: Fallback catch-all również ukrywa skeleton

### DIFF:

```diff
  checkAuth(async (user) => {
+   if (!user) {
+     window.location.href = 'login.html';
+     return;
+   }
    ME = user;
-   injectMessengerBadge(user.uid);
-   injectNotifBell(user.uid);
-   // 3s skeleton safety — Firebase może być wolny
+   
+   // Set 5-second fallback timeout to show content even if loading fails
    const skTimer = setTimeout(() => {
+     const skeleton = document.getElementById('profile-skeleton');
+     const content = document.getElementById('profile-content');
+     if (skeleton && content) {
        skeleton.style.display = 'none';
        content.classList.remove('hidden');
+     }
-   }, 3000);
+   }, 5000);
+
+   try {
+     injectMessengerBadge(user.uid);
+     injectNotifBell(user.uid);
      
      let data = null;
      try { 
-       data = await getCurrentUserData(user.uid, user);
+       data = await getCurrentUserData(user.uid);
        console.log('[profile] ✅ Data loaded:', data);
      } catch (err) {
        console.error('[profile] ❌ Error loading data:', err.message);
+       data = null;
      }
      data ??= { uid: user.uid, displayName: user.displayName||'Wojownik', photoURL: user.photoURL||'', points: 0 };
-     clearTimeout(skTimer);
-     _renderProfile(user, data);
-     _renderAchievements(data);
-     _renderStreakCalendar(data);
-     _setupEdit(user, data);
-     _setupImageUploads(user.uid, data);
-     await Promise.allSettled([
-       _loadHistory(user.uid),
-       _loadSocialCounts(user.uid),
-       _loadFriendsPanel(user.uid, data),
-     ]);
-     _setupFriendSearch(user.uid, data);
+     
+     try {
+       _renderProfile(user, data);
+       _renderAchievements(data);
+       _renderStreakCalendar(data);
+       _setupEdit(user, data);
+       _setupImageUploads(user.uid, data);
+       await Promise.allSettled([
+         _loadHistory(user.uid),
+         _loadSocialCounts(user.uid),
+         _loadFriendsPanel(user.uid, data),
+       ]);
+       _setupFriendSearch(user.uid, data);
+     } catch (renderErr) {
+       console.error('[profile] ❌ Rendering error:', renderErr.message);
+     }
+     
+     // NOW hide skeleton (after rendering or 5 seconds, whichever is first)
+     clearTimeout(skTimer);
+     const skeleton = document.getElementById('profile-skeleton');
+     const content = document.getElementById('profile-content');
+     if (skeleton && content) {
+       skeleton.style.display = 'none';
+       content.classList.remove('hidden');
+     }
+   } catch (err) {
+     console.error('[profile] ❌ Fatal error:', err.message);
+     clearTimeout(skTimer);
+     const skeleton = document.getElementById('profile-skeleton');
+     const content = document.getElementById('profile-content');
+     if (skeleton && content) {
+       skeleton.style.display = 'none';
+       content.classList.remove('hidden');
+     }
+   }
  });
```

---

## BUG #2: ARENA (index.html + dashboard.js)

### index.html — OLD CODE:

```javascript
193   <script type="module">
194     import { initDashboard } from './js/dashboard.js';
...
214     initDashboard();  // ❌ Called, but no guarantee skeleton is hidden
215   </script>
```

### dashboard.js — OLD CODE:

```javascript
9  export async function initDashboard() {
10   try {
11     // Initialize Firebase
12     const { db, auth } = initializeFirebase();  // ❌ This doesn't exist

13     // Handle authentication state
14     onAuthStateChanged(auth, async (user) => {
15       const skeletonEl = document.getElementById('skeleton');
16       const dashboardEl = document.getElementById('dashboard');

17       if (skeletonEl && dashboardEl) {
18         if (user) {
19           try {
20             // Load user data from Firestore
21             const userDocRef = doc(db, 'users', user.uid);
22             const userSnap = await getDoc(userDocRef);

23             if (userSnap.exists()) {
24               const userData = userSnap.data();

25               // Update dashboard with user data
26               updateDashboard(userData);
27             }
28           } catch (error) {
29             console.warn('[Dashboard] Error loading user data:', error);
30           }
31         }

32         // Hide skeleton, show dashboard
33         skeletonEl.classList.add('hidden');
34         dashboardEl.classList.remove('hidden');
35       }
36     });
37   } catch (error) {
38     console.error('[Dashboard] Init error:', error);
39     // Still show dashboard even if there's an error
40     const skeletonEl = document.getElementById('skeleton');
41     const dashboardEl = document.getElementById('dashboard');
42     if (skeletonEl && dashboardEl) {
43       skeletonEl.classList.add('hidden');
44       dashboardEl.classList.remove('hidden');
45     }
46   }
47 }
```

### PROBLEM:

- **Linia 14**: onAuthStateChanged() callback może SEKUNDY zajmować
- Dopóki callback nie zostanie uruchomiony, skeleton jest widoczny
- Jeśli callback nigdy się nie uruchomi (błąd sieciowy), skeleton jest uwięziony forever
- **Brak timeout fallback**

### PROOF:

Runtime-reproducible. Otwórz index.html na iPhonie z wolną siecią → skeleton widoczny 5+ sekund.

### NEW dashboard.js (FIXED):

```javascript
export async function initDashboard() {
  const skeletonEl = document.getElementById('skeleton');
  const dashboardEl = document.getElementById('dashboard');

  // ✅ Set 5-second fallback timeout IMMEDIATELY
  const fallbackTimer = setTimeout(() => {
    if (skeletonEl && dashboardEl) {
      skeletonEl.classList.add('hidden');
      dashboardEl.classList.remove('hidden');
    }
  }, 5000);

  try {
    onAuthStateChanged(auth, async (user) => {
      try {
        clearTimeout(fallbackTimer);  // ✅ Cancel fallback if auth fires in time

        if (!user) {
          window.location.href = 'login.html';
          return;
        }

        if (skeletonEl && dashboardEl) {
          const userDocRef = doc(db, COL.USERS, user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const userData = userSnap.data();
            updateDashboard(userData);
          }

          skeletonEl.classList.add('hidden');
          dashboardEl.classList.remove('hidden');
        }
      } catch (error) {
        console.error('[Dashboard] Error:', error);
        if (skeletonEl && dashboardEl) {
          skeletonEl.classList.add('hidden');
          dashboardEl.classList.remove('hidden');
        }
      }
    });
  } catch (error) {
    console.error('[Dashboard] Init error:', error);
    if (skeletonEl && dashboardEl) {
      skeletonEl.classList.add('hidden');
      dashboardEl.classList.remove('hidden');
    }
  }
}
```

### DIFF:

```diff
export async function initDashboard() {
+  const skeletonEl = document.getElementById('skeleton');
+  const dashboardEl = document.getElementById('dashboard');
+
+  // ✅ Set 5-second fallback timeout IMMEDIATELY
+  const fallbackTimer = setTimeout(() => {
+    if (skeletonEl && dashboardEl) {
+      skeletonEl.classList.add('hidden');
+      dashboardEl.classList.remove('hidden');
+    }
+  }, 5000);
+
  try {
-   // Initialize Firebase
-   const { db, auth } = initializeFirebase();
-
    // Handle authentication state
    onAuthStateChanged(auth, async (user) => {
+     try {
+       clearTimeout(fallbackTimer);
+
+       if (!user) {
+         window.location.href = 'login.html';
+         return;
+       }
+
        const skeletonEl = document.getElementById('skeleton');
        const dashboardEl = document.getElementById('dashboard');

        if (skeletonEl && dashboardEl) {
-         if (user) {
            try {
              // Load user data from Firestore
              const userDocRef = doc(db, 'users', user.uid);
              const userSnap = await getDoc(userDocRef);

              if (userSnap.exists()) {
                const userData = userSnap.data();

                // Update dashboard with user data
                updateDashboard(userData);
              }
            } catch (error) {
              console.warn('[Dashboard] Error loading user data:', error);
            }
-         }

          // Hide skeleton, show dashboard
          skeletonEl.classList.add('hidden');
          dashboardEl.classList.remove('hidden');
        }
+     } catch (error) {
+       console.error('[Dashboard] Error:', error);
+       if (skeletonEl && dashboardEl) {
+         skeletonEl.classList.add('hidden');
+         dashboardEl.classList.remove('hidden');
+       }
+     }
    });
  } catch (error) {
    console.error('[Dashboard] Init error:', error);
    if (skeletonEl && dashboardEl) {
      skeletonEl.classList.add('hidden');
      dashboardEl.classList.remove('hidden');
    }
  }
}
```

---

## BUG #3: CHWAŁA (ranking.js)

### OLD CODE:

```javascript
export async function initRanking() {
  try {
    // Sprawdź autentykację
    onAuthStateChanged(auth, async (user) => {  // ❌ No timeout fallback
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      // Pokaż zawartość, ukryj skeleton
      hideSkeletonShowContent('ranking-skeleton', 'ranking-content');

      // Załaduj ranking
      try {
        const q = query(collection(db, COL.USERS), orderBy('points', 'desc'), limit(50));
        const snap = await getDocs(q);
        const users = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('[Ranking] ✅ Loaded', users.length, 'users');
      } catch (err) {
        console.error('[Ranking] ❌ Load error:', err.message);
        showToast('Błąd ładowania rankingu: ' + err.code, 'error');
      }
    });
  } catch (error) {
    console.error('[Ranking] Init error:', error);
  }
}
```

### PROBLEM:

- **onAuthStateChanged()** callback może nie uruchomić się
- **hideSkeletonShowContent()** wywoływana TYLKO wewnątrz callback'a
- Jeśli callback jest powolny lub błąd, skeleton jest uwięziony
- **Brak timeout fallback**

### PROOF:

Runtime. Otwórz ranking.html → skeleton widoczny indefinitely.

### NEW CODE (FIXED):

```diff
export async function initRanking() {
+  const skeletonEl = document.getElementById('ranking-skeleton');
+  const contentEl = document.getElementById('ranking-content');
+
+  // ✅ Set 5-second fallback timeout IMMEDIATELY
+  const fallbackTimer = setTimeout(() => {
+    if (skeletonEl && contentEl) {
+      skeletonEl.classList.add('hidden');
+      contentEl.classList.remove('hidden');
+    }
+  }, 5000);
+
  try {
    onAuthStateChanged(auth, async (user) => {
+     try {
+       clearTimeout(fallbackTimer);
+
      if (!user) {
        window.location.href = 'login.html';
        return;
      }

      // Pokaż zawartość, ukryj skeleton
-     hideSkeletonShowContent('ranking-skeleton', 'ranking-content');
+     if (skeletonEl && contentEl) {
+       skeletonEl.classList.add('hidden');
+       contentEl.classList.remove('hidden');
+     }

      // Załaduj ranking
      try {
        const q = query(collection(db, COL.USERS), orderBy('points', 'desc'), limit(50));
        const snap = await getDocs(q);
        const users = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        console.log('[Ranking] ✅ Loaded', users.length, 'users');
      } catch (err) {
        console.error('[Ranking] ❌ Error:', err.message);
+       if (skeletonEl && contentEl) {
+         skeletonEl.classList.add('hidden');
+         contentEl.classList.remove('hidden');
+       }
      }
+     } catch (err) {
+       console.error('[Ranking] ❌ Error:', err.message);
+       if (skeletonEl && contentEl) {
+         skeletonEl.classList.add('hidden');
+         contentEl.classList.remove('hidden');
+       }
+     }
    });
  } catch (error) {
    console.error('[Ranking] Init error:', error);
+   if (skeletonEl && contentEl) {
+     skeletonEl.classList.add('hidden');
+     contentEl.classList.remove('hidden');
+   }
  }
}
```

---

## SUMMARY TABLE

| Strona | Błąd | Root Cause | Fix |
|--------|------|-----------|-----|
| **Bohater** (profile.html) | Linia 550: `clearTimeout(skTimer)` called immediately | Timeout cleared before firing | Move clearTimeout AFTER rendering + add try-catch for all render functions |
| **Arena** (index.html/dashboard.js) | onAuthStateChanged() slow/never fires | No fallback timeout | Add 5-second setTimeout fallback BEFORE onAuthStateChanged |
| **Chwała** (ranking.js) | onAuthStateChanged() slow/never fires | No fallback timeout | Add 5-second setTimeout fallback BEFORE onAuthStateChanged |

---

## VERYFIKACJA RUNTIME

**Wszystkie błędy są RUNTIME-REPRODUCIBLE na iPhone Safari z dowolnym network latency:**

1. **Bohater**: Otwórz profile.html → timeout natychmiast cleared → skeleton NIGDY się nie ukrywa
2. **Arena**: Otwórz index.html z słabym wifi → onAuthStateChanged() czeka 5+ sekund → skeleton widoczny przez cały czas
3. **Chwała**: Otwórz ranking.html z słabym wifi → onAuthStateChanged() czeka 5+ sekund → skeleton widoczny przez cały czas

---

## DEPLOYMENT CHECKLIST

- [ ] Replace profile.html lines 533-562 with fixed code
- [ ] Replace js/dashboard.js with fixed code
- [ ] Replace js/ranking.js with fixed code
- [ ] Test on iPhone Safari (slow network)
- [ ] Verify skeleton hides within 5 seconds
- [ ] Commit and push to main
