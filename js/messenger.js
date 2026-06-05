*** Begin Patch
*** Update File: js/messenger.js
@@
 import {
   collection, doc, addDoc, getDoc, getDocs, setDoc,
   updateDoc, onSnapshot, query, where, orderBy, limit,
   serverTimestamp, Timestamp, increment, writeBatch,
   arrayUnion,
 } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
 
 // ── Kolekcje ─────────────────────────────────────────────────
 const COL_CONV = 'conversations';
 const COL_MSG  = 'messages';
 
 // ── Stan modułu ──────────────────────────────────────────────
 let currentUser     = null;
 let currentUserData = null;
 let activeConvId    = null;
 let unsubMessages   = null;    // cleanup onSnapshot wiadomości
 let unsubConvList   = null;    // cleanup onSnapshot listy conv
 let typingTimer     = null;
 const MAX_MSG_LEN   = 1000;
 const MAX_IMG_SIZE  = 5 * 1024 * 1024; // 5 MB
 const TYPING_TTL    = 3000;   // 3s bez pisania → wyczyść typing
+/**
+ * Centralny handler błędów.
+ * Loguje szczegóły do konsoli i (opcjonalnie) pokazuje przyjazny komunikat użytkownikowi.
+ * Nie rzuca wyjątków dalej.
+ */
+function _handleError(TAG, err, userMessage = null) {
+  try {
+    // Pełne logi do konsoli (przydatne w dev / telemetry)
+    console.error(TAG, err);
+    // Przyjazny komunikat dla użytkownika
+    if (userMessage) {
+      try { showToast(userMessage, 'error'); } catch {}
+    }
+    // Tutejsze miejsce na wysyłkę do telemetry (Sentry/Analytics) jeśli dodasz później.
+  } catch (e) {
+    // Absolutnie nic więcej tu nie róbmy — handler błędów nie powinien wyrzucać.
+    console.error('[handleError]', e);
+  }
+}
 
 
 // ════════════════════════════════════════════════════════════
 // INIT — messenger.html
 // ════════════════════════════════════════════════════════════
 
 export function initMessenger() {
   const TAG = '[initMessenger]';
   console.log(TAG, '🚀 Start');
 
   checkAuth(async (user) => {
     currentUser = user;
     console.log(TAG, '✅ User:', user.uid);
 
     try {
-      currentUserData = await getCurrentUserData(user.uid, user);
+      currentUserData = await getCurrentUserData(user.uid, user);
     } catch {
-      currentUserData = null;
+      _handleError(TAG, arguments?.[0] ?? new Error('getCurrentUserData failed'));
+      currentUserData = null;
     }
     if (!currentUserData) {
       currentUserData = {
         uid: user.uid,
         displayName: user.displayName || 'Wojownik',
         photoURL: user.photoURL || '',
         points: 0,
       };
     }
@@
     // Inicjalizuj listę konwersacji
     _startConvListStream();
 
     if (convParam) {
       _openConvById(convParam);
     } else if (uidParam && uidParam !== user.uid) {
       openConversation(uidParam);
     }
 
     // Skeleton hide
     document.getElementById('msg-skeleton')?.classList.add('hidden');
     document.getElementById('msg-content')?.classList.remove('hidden');
   });
 }
 
@@
 function _startConvListStream() {
   const TAG = '[convListStream]';
   if (unsubConvList) { unsubConvList(); }
 
   const q = query(
     collection(db, COL_CONV),
     where('participants', 'array-contains', currentUser.uid),
     orderBy('lastMessageAt', 'desc'),
     limit(50),
   );
 
-  unsubConvList = onSnapshot(q, async (snap) => {
+  unsubConvList = onSnapshot(q, async (snap) => {
     console.log(TAG, `✅ ${snap.size} konwersacji`);
     const listEl = document.getElementById('conv-list');
     if (!listEl) return;
     listEl.innerHTML = '';
 
     if (snap.empty) {
       listEl.innerHTML = `
         <div class="conv-empty">
           <div style="font-size:2rem;margin-bottom:.5rem;">💬</div>
           <div style="font-family:var(--font-hd);font-size:.875rem;color:var(--text-muted);">
             Brak rozmów.<br>Zacznij od profilu wojownika.
           </div>
         </div>`;
       return;
     }
 
     for (const docSnap of snap.docs) {
       const data    = docSnap.data();
       const convId  = docSnap.id;
       const otherId = data.participants.find(p => p !== currentUser.uid);
       if (!otherId) continue;
 
       // Pobierz dane rozmówcy
       let other = { displayName: 'Wojownik', photoURL: '' };
       try {
         const s = await getDoc(doc(db, COL.USERS, otherId));
         if (s.exists()) other = s.data();
       } catch {
-      }
+        _handleError(TAG, arguments?.[0] ?? new Error('getDoc users failed'));
+      }
 
       const unread = data[`unread_${currentUser.uid}`] ?? 0;
       const isActive = convId === activeConvId;
       const item     = _buildConvItem(convId, data, other, unread, isActive);
       listEl.appendChild(item);
     }
-  }, err => console.warn(TAG, err.code));
+  }, (err) => {
+    _handleError(TAG, err, 'Błąd pobierania listy rozmów. Sprawdź połączenie.');
+    // prosty retry
+    setTimeout(() => _startConvListStream(), 2000);
+  });
 }
 
@@
   try {
     const snap = await getDoc(doc(db, COL_CONV, convId));
     if (!snap.exists()) { showToast('Konwersacja nie istnieje.', 'error'); return; }
     convData = snap.data();
-  } catch { return; }
+  } catch (err) { _handleError(TAG, err, 'Nie można pobrać danych konwersacji.'); return; }
 
   // Pobierz dane rozmówcy
   const otherId = convData.participants?.find(p => p !== currentUser.uid);
   let other = { displayName: 'Wojownik', photoURL: '' };
   if (otherId) {
     try {
       const s = await getDoc(doc(db, COL.USERS, otherId));
       if (s.exists()) other = s.data();
-    } catch {}
+    } catch (err) { _handleError(TAG, err); }
   }
 
@@
 function _watchPresence(otherId, convId) {
+  const TAG = '[watchPresence]';
   let unsubPresence;
   const ref = doc(db, COL.USERS, otherId);
 
   unsubPresence = onSnapshot(ref, (snap) => {
     if (!snap.exists()) return;
     const data = snap.data();
     const isOnline = data.presence?.online === true;
     const isTyping = data.presence?.typing?.[convId] &&
       (Date.now() - (data.presence.typing[convId]?.seconds ?? 0) * 1000) < TYPING_TTL;
 
     const dot      = document.getElementById('chat-status-dot');
     const statusEl = document.getElementById('chat-online-status');
     const typingEl = document.getElementById('chat-typing-indicator');
 
     if (dot)      dot.className = `chat-status-dot ${isOnline ? 'online' : 'offline'}`;
     if (typingEl) typingEl.style.display = isTyping ? 'inline' : 'none';
     if (statusEl) statusEl.style.display = isTyping ? 'none' : 'inline';
     if (statusEl) statusEl.textContent   = isOnline ? 'online' : 'offline';
-  }, () => {});
+  }, (err) => _handleError(TAG, err));
 
   // Cleanup gdy zamknięty conv
   const origUnsub = unsubMessages;
   unsubMessages = () => {
     if (origUnsub) origUnsub();
     if (unsubPresence) unsubPresence();
   };
 }
 /** Ustaw własne presence online */
 export async function setOnlinePresence(uid, online = true) {
   if (!uid) return;
   try {
     await updateDoc(doc(db, COL.USERS, uid), {
       'presence.online': online,
       'presence.lastSeen': serverTimestamp(),
     });
-  } catch {}
+  } catch (err) { _handleError('[setOnlinePresence]', err); }
 }
 
 /** Ustaw typing indicator */
 async function _setTyping(convId) {
   if (!currentUser || !convId) return;
   try {
     await updateDoc(doc(db, COL.USERS, currentUser.uid), {
       [`presence.typing.${convId}`]: serverTimestamp(),
     });
-  } catch {}
+  } catch (err) { _handleError('[setTyping]', err); }
 }
 
 async function _clearTyping() {
   if (!currentUser || !activeConvId) return;
   try {
     await updateDoc(doc(db, COL.USERS, currentUser.uid), {
       [`presence.typing.${activeConvId}`]: null,
     });
-  } catch {}
+  } catch (err) { _handleError('[clearTyping]', err); }
 }
 
@@
   unsubMessages = onSnapshot(q, (snap) => {
     console.log(TAG, `${snap.size} wiadomości`);
     if (!msgList) return;
 
     const wasAtBottom = _isScrolledToBottom(msgList);
     msgList.innerHTML = '';
 
     if (snap.empty) {
       msgList.innerHTML = `
         <div style="text-align:center;padding:2rem;font-family:var(--font-hd);
           font-size:.875rem;color:var(--text-muted);">
           Powiedz cześć! 👋
         </div>`;
       return;
     }
 
     let prevDate = null;
     snap.forEach((docSnap) => {
       const msg  = { id: docSnap.id, ...docSnap.data() };
       const date = msg.createdAt?.toDate?.() ?? new Date();
       const dateStr = date.toLocaleDateString('pl-PL', { day:'numeric', month:'long' });
 
       if (dateStr !== prevDate) {
         const sep = document.createElement('div');
         sep.className = 'msg-date-sep';
         sep.textContent = dateStr;
         msgList.appendChild(sep);
         prevDate = dateStr;
       }
 
       msgList.appendChild(_buildMsgBubble(msg));
     });
 
     if (wasAtBottom) _scrollToBottom(msgList);
-  }, err => console.warn(TAG, err.code));
+  }, (err) => {
+    _handleError(TAG, err, 'Błąd pobierania wiadomości. Spróbuj ponownie.');
+    // Unsubscribe and try to restart stream to recover from transient errors
+    if (unsubMessages) { try { unsubMessages(); } catch {} unsubMessages = null; }
+    setTimeout(() => { if (activeConvId) _startMessageStream(activeConvId); }, 2000);
+  });
 }
 
@@
   imgInput?.addEventListener('change', async (e) => {
     const file = e.target.files?.[0];
     if (!file) return;
 
     if (!['image/jpeg','image/png','image/webp','image/gif'].includes(file.type)) {
       showToast('Dozwolone: JPG, PNG, WebP, GIF', 'error'); return;
     }
     if (file.size > MAX_IMG_SIZE) {
       showToast('Maks. 5 MB.', 'error'); return;
     }
 
@@
     // Upload do Cloudinary
     showToast('Przesyłam zdjęcie...', 'info', 2000);
     try {
       const result = await uploadToCloudinary(file, `dm/${currentUser.uid}`);
       pendingImage = { url: result.url, publicId: result.publicId };
       imgBtn?.classList.add('active');
-    } catch (err) {
-      showToast(err.message || 'Błąd uploadu', 'error');
-      pendingImage = null;
-      if (previewEl) previewEl.style.display = 'none';
+    } catch (err) {
+      _handleError('[compose]', err, 'Błąd uploadu zdjęcia.');
+      showToast(err.message || 'Błąd uploadu', 'error');
+      pendingImage = null;
+      if (previewEl) previewEl.style.display = 'none';
     }
     if (imgInput) imgInput.value = '';
   });
 
@@
     } catch (err) {
-      console.error('[sendMsg]', err.code, err.message);
-      showToast('Błąd wysyłania.', 'error');
+      _handleError('[sendMsg]', err, 'Błąd wysyłania.');
     } finally {
       isSending = false;
       if (sendBtn) sendBtn.disabled = false;
       inputEl?.focus();
     }
   }
 }
 
@@
 async function _markConvRead(convId) {
   if (!currentUser) return;
   try {
     await updateDoc(doc(db, COL_CONV, convId), {
       [`unread_${currentUser.uid}`]: 0,
     });
-  } catch {}
+  } catch (err) { _handleError('[markConvRead]', err); }
 }
 
@@
 export async function getUnreadCount(myUid) {
   if (!myUid) return 0;
   try {
     const snap = await getDocs(query(
       collection(db, COL_CONV),
       where('participants', 'array-contains', myUid),
     ));
     let total = 0;
     snap.forEach(d => { total += d.data()[`unread_${myUid}`] ?? 0; });
     return total;
-  } catch {
-    return 0;
+  } catch (err) {
+    _handleError('[getUnreadCount]', err);
+    return 0;
   }
 }
@@
   onSnapshot(q, (snap) => {
     let total = 0;
     snap.forEach(d => { total += d.data()[`unread_${myUid}`] ?? 0; });
 
     const badge = document.getElementById('msg-nav-badge');
     if (badge) {
       badge.textContent  = total > 9 ? '9+' : total;
       badge.style.display = total > 0 ? 'flex' : 'none';
     }
-  }, () => {});
+  }, (err) => _handleError('[injectBadge]', err));
 }
 
*** End Patch
