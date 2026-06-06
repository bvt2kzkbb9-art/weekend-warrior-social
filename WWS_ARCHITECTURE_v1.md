# WEEKEND WARRIOR SOCIAL — PEŁNA ARCHITEKTURA SYSTEMU
## Blueprint Wdrożeniowy v1.0
### Lead System Architect Document

---

## AKTUALNY STAN PROJEKTU

### Istniejące kolekcje Firestore

```
users/{uid}
  uid, displayName, username, email, photoURL, bio
  points, level, rank, createdAt, lastActive
  achievements: string[]
  pokeCount, pokeSentCount
  presence: { online, lastSeen, typing: {} }

posts/{postId}
  authorId, authorName, authorPhoto, authorRank, authorRankEmoji
  content, imageUrl, imageStoragePath, hashtags: string[]
  likes: uid[], likesCount
  reactions: { like:[], warrior:[], fire:[], legend:[], brutal:[] }
  reactionsCount, commentsCount, createdAt

posts/{postId}/comments/{commentId}
  authorId, authorName, authorPhoto, authorRank, content, createdAt

followers/{autoId}
  followerId, followingId, createdAt

notifications/{uid}/items/{notifId}
  type, title, body, icon, url, read, createdAt

conversations/{convId}
  participants: [uid1, uid2]
  lastMessage, lastMessageAt, lastMessageBy
  unread_uid1: number, unread_uid2: number
  createdAt

conversations/{convId}/messages/{msgId}
  senderId, senderName, senderPhoto
  text, type, imageUrl, imagePublicId, embedUrl, embedMeta
  read, createdAt

pokes/{autoId}
  pokerId, pokerName, pokerPhoto, targetId, createdAt

duels/{autoId}
  challengerId, challengerName, challengerPhoto
  targetId, targetName
  challengeId, challengeTitle, challengeEmoji, challengeXP
  status: pending|accepted|rejected|completed
  expiresAt, createdAt

challenge_invites/{autoId}
  challengerId, challengerName, challengerPhoto
  targetId, targetName
  challengeId, challengeTitle, challengeBadge, challengeXP
  status: pending, createdAt

challenge_completions/{autoId}
weeklyScores/{weekId}/scores/{uid}
```

### Istniejące XP_ACTIONS
```
POST_CREATED:     +10 XP
LIKE_RECEIVED:    +2  XP
COMMENT_ADDED:    +3  XP
COMMENT_RECEIVED: +1  XP
DAILY_LOGIN:      +5  XP
```

### Istniejące osiągnięcia (20 sztuk)
```
first_post, five_posts, ten_posts, fifty_posts
first_comment, twenty_comments
first_like, ten_likes, fifty_likes
rank_warrior, rank_champion, rank_legend
golden_circle, dragon_slayer, light_guardian, two_worlds
golden_disc, chaos_serpents, flower_order, sun_circle
```

### Istniejące odznaki społecznościowe (weekly-ranking.js)
```
gaduła, kronikarz, lagowy_lord, streamer, rozpalacz, wojownik_tygodnia
```

---

---

# SYSTEMY DO ZAPROJEKTOWANIA

---

## SYSTEM 1 — WYSZUKIWARKA UŻYTKOWNIKÓW

### Cel
Umożliwienie znajdowania wojowników po nazwie lub nicku.

### Opis działania
Użytkownik wpisuje frazę w pole wyszukiwania. Aplikacja wykonuje zapytanie Firestore `where('username', '>=', query)` oraz `where('username', '<=', query + '\uf8ff')` (prefix search). Wyniki wyświetlają avatar, nazwę, rangę i przycisk Obserwuj.

### Ograniczenie techniczne
Firestore nie ma pełnotekstowego wyszukiwania. Rozwiązanie: prefix search na polu `username` (lowercase, bez spacji). Alternatywa dla v2.0: Algolia lub Typesense.

### Widoki użytkownika
- Pasek wyszukiwania w nav (mobile: osobna ikona)
- `search.html` — strona wyników
- Sekcja "Znajomi w pobliżu" na index.html (TOP 5 nowych użytkowników)

### Firestore Collections
```
users  — istniejąca kolekcja
```

### Firestore Documents
Brak nowych. Wymaga pola `username` (już istnieje) + pola `searchTokens` (opcjonalne dla lepszego search).

```
users/{uid}
  username: string     // lowercase, bez spacji, max 30 znaków — ISTNIEJE
  displayName: string  // do wyświetlania — ISTNIEJE
  searchTokens: string[] // opcjonalne: ['jan', 'jan_ko', 'jan_kow'] — NOWE
```

### Firestore Indexes
```
COMPOSITE: users → username ASC
COMPOSITE: users → displayName ASC
```

### Firestore Rules
```
match /users/{uid} {
  allow read: if request.auth != null;  // ISTNIEJE
}
```

### Cloudinary Requirements
Brak. Avatary już obsługiwane.

### Powiadomienia
Brak.

### Powiązania
- `social.js` — `followUser()` widoczne z wyników wyszukiwania
- `user.html` — kliknięcie wyników otwiera profil publiczny

### Ryzyko wdrożenia
**Niskie.** Prefix search na Firestore działa bez dodatkowych indeksów przy małej bazie. Przy >10 000 użytkowników konieczna zewnętrzna wyszukiwarka.

### Kolejność implementacji
1. Upewnij się że `username` jest w lowercase w dokumencie użytkownika
2. Utwórz `search.html` z polem input + wynikami
3. Utwórz `js/search.js` z funkcją `searchUsers(query)`
4. Podłącz do nav

### Priorytet: **P2 — WAŻNE**

---

## SYSTEM 2 — LISTA ZNAJOMYCH (FRIENDS)

### Cel
Wzajemna obserwacja jako "znajomość" (oboje obserwują się nawzajem).

### Decyzja architektoniczna: Wariant B — rozbudowa followers

**Porównanie:**

| Kryterium | A: osobna kolekcja `friends` | B: rozbudowa `followers` |
|---|---|---|
| Zapytania | Proste, 1 kolekcja | 2 zapytania (sprawdź oba kierunki) |
| Migracja danych | Nowa kolekcja, migracja istniejących follows | Bez migracji |
| Złożoność reguł | Umiarkowana | Niska |
| Zgodność z istniejącym kodem | Wymaga przepisania `social.js` | Minimalne zmiany |
| Facebook-like UX | Wymaga statusu pending/accepted | Wymaga loiki "mutual follow" |

**Rekomendacja: Wariant B** — rozbudowa `followers` o pole `mutual`.

Gdy A obserwuje B i B obserwuje A, oboje są "znajomymi". Bez oddzielnej kolekcji.

### Nowe pole w documents
```
followers/{autoId}
  followerId:  uid
  followingId: uid
  createdAt:   Timestamp
  // NOWE:
  mutual:      boolean  // true gdy followingId też obserwuje followerId
```

### Logika mutual
Po wykonaniu `followUser(A, B)`:
1. Sprawdź czy istnieje `followers` gdzie `followerId==B AND followingId==A`
2. Jeśli tak → ustaw `mutual=true` w obu dokumentach
3. Wyślij powiadomienie `friend_added` do obu

### Widoki użytkownika
- Zakładka "Znajomi" na `profile.html`
- Lista wzajemnych połączeń
- Widget "Może znasz?" na `index.html`

### Firestore Collections
```
followers  — istniejąca, rozszerzona o pole mutual
```

### Firestore Indexes
```
COMPOSITE: followers → followerId ASC + mutual ASC
COMPOSITE: followers → followingId ASC + mutual ASC
```

### Firestore Rules
```
match /followers/{docId} {
  allow read:   if request.auth != null;
  allow create: if request.auth != null
                && request.resource.data.followerId == request.auth.uid;
  allow update: if request.auth != null;  // dla ustawiania mutual
  allow delete: if request.auth != null
                && resource.data.followerId == request.auth.uid;
}
```

### Powiadomienia
```
Typ: friend_added
Ikona: 🤝
Treść: "{name} jest teraz Twoim znajomym!"
```

### Powiązania
- `social.js` — rozbudowa `followUser()` o logikę mutual
- `notifications.js` — nowy typ `friend_added`
- `achievements.js` — nowe osiągnięcie `first_friend`

### Ryzyko: **Niskie**

### Priorytet: **P3 — STANDARD**

---

## SYSTEM 3 — MESSENGER (ARCHITEKTURA PEŁNA)

### Stan aktualny
Messenger jest **zaimplementowany** w `js/messenger.js` + `messenger.html` + `css/messenger.css`. Poniżej pełna dokumentacja istniejącej architektury.

### Conversations Document
```
conversations/{uid1_uid2}   // deterministyczne ID: sort([uid1,uid2]).join('_')
  participants:    [uid1, uid2]
  lastMessage:     string
  lastMessageAt:   Timestamp
  lastMessageBy:   uid
  unread_uid1:     number
  unread_uid2:     number
  createdAt:       Timestamp
```

### Messages Subcollection
```
conversations/{convId}/messages/{autoId}
  senderId:      uid
  senderName:    string
  senderPhoto:   string
  text:          string
  type:          'text' | 'image' | 'embed'
  imageUrl:      string
  imagePublicId: string  // do usunięcia z Cloudinary
  embedUrl:      string
  embedMeta:     { title, thumbnail }
  read:          boolean
  createdAt:     Timestamp
```

### Online Status & Typing
```
users/{uid}
  presence: {
    online:   boolean
    lastSeen: Timestamp
    typing: {
      [convId]: Timestamp  // null gdy nie pisze
    }
  }
```

### Unread Counters
Pole `unread_{uid}` w dokumencie konwersacji. `increment(1)` przy każdej wysłanej wiadomości przez drugą osobę. Reset do `0` przy otwarciu konwersacji.

### Attachments
Cloudinary upload do folderu `dm/{senderUid}/`. Format: JPG/PNG/WebP/GIF, max 5 MB.

### Brakujące do uzupełnienia
```
1. Usuwanie wiadomości (soft delete: deleted: true)
2. Edycja wiadomości (editedAt: Timestamp)
3. Reakcje na wiadomości (reactions: { [emoji]: uid[] })
4. Grupy czatowe (participants: uid[], isGroup: bool, groupName, groupPhoto)
5. Status "dostarczono" (delivered: boolean)
6. Wyszukiwanie w konwersacji (client-side text search)
```

### Firestore Indexes
```
COMPOSITE: conversations → participants ARRAY_CONTAINS + lastMessageAt DESC
COMPOSITE: conversations/{id}/messages → createdAt ASC
```

### Firestore Rules (istniejące, wymagane)
```
match /conversations/{convId} {
  allow read:   if request.auth.uid in resource.data.participants;
  allow create: if request.auth.uid in request.resource.data.participants;
  allow update: if request.auth.uid in resource.data.participants;
}
match /conversations/{convId}/messages/{msgId} {
  allow read:   if request.auth.uid in
                   get(/databases/.../conversations/$(convId)).data.participants;
  allow create: if request.auth.uid == request.resource.data.senderId;
}
```

### Powiadomienia
```
Typ: message
Ikona: 💬
Treść: "{name} wysłał wiadomość"
URL: messenger.html?conv={convId}
```

### Priorytet: **P1 — ZAIMPLEMENTOWANE** (wymaga bugfixów)

---

## SYSTEM 4 — FEED 2.0

### Stan aktualny
Feed 2.0 jest **zaimplementowany** w `js/feed.js`. Trzy zakładki (Dla Ciebie / Obserwowani / Najnowsze), reakcje (5 typów), @mention, #hashtag, udostępnianie.

### Brakujące funkcje do v2.0

#### 4.1 Udostępnianie postów (Reshare)
```
posts/{postId}
  // NOWE:
  shareCount:  number
  sharedFrom:  postId | null  // jeśli post jest udostępnieniem
  originalAuthorId:   uid
  originalAuthorName: string
  originalPostId:     string
  isShare:     boolean
```

```
shares/{autoId}
  postId:     string
  sharerId:   uid
  sharerName: string
  createdAt:  Timestamp
```

#### 4.2 Hashtag stream
```
Zapytanie:
  collection(posts)
  where('hashtags', 'array-contains', tag)
  orderBy('createdAt', 'desc')

WYMAGA INDEKSU:
  posts → hashtags ARRAY_CONTAINS + createdAt DESC
```

#### 4.3 Pinnowane posty
```
posts/{postId}
  pinned:       boolean
  pinnedAt:     Timestamp
  pinnedBy:     uid  // admin/moderator
```

#### 4.4 Treść tylko dla obserwujących
```
posts/{postId}
  visibility: 'public' | 'followers' | 'friends'
```

### Wymagane nowe indeksy
```
COMPOSITE: posts → hashtags ARRAY_CONTAINS + createdAt DESC
COMPOSITE: posts → authorId ASC + createdAt DESC
COMPOSITE: posts → pinned ASC + createdAt DESC
```

### Priorytet: **P1 — CZĘŚCIOWO ZAIMPLEMENTOWANE**

---

## SYSTEM 5 — REAKCJE FACEBOOKOWE

### Stan aktualny
**Zaimplementowane** w `feed.js`. 5 reakcji: 👍⚔️🔥👑💀

### Brakujące
1. Animacje picker (CSS transitions istnieją)
2. Lista "kto zareagował" (modal po kliknięciu w licznik)
3. Reakcje na komentarze

### Lista kto zareagował — nowa kolekcja opcjonalna
```
Alternatywa bez nowej kolekcji:
  Fetch post → iteruj reactions.{type} array → getDocs users
  (nie potrzeba nowej kolekcji)
```

### Priorytet: **P2 — UZUPEŁNIENIE**

---

## SYSTEM 6 — HASHTAGI

### Stan aktualny
**Częściowo zaimplementowane.** Posty zapisują `hashtags: string[]`. Kliknięcie w tag pokazuje toast z TODO.

### Do zaimplementowania
1. `hashtag.html` — strona hashtagów z listą postów
2. Trending hashtags (najpopularniejsze w ostatnich 7 dniach)

### Kolekcja trendingów (opcjonalna, obliczana client-side)
```
hashtagStats/{tag}
  tag:       string
  count:     number  // liczba postów z tym tagiem
  lastUsed:  Timestamp

// ALTERNATYWA: oblicz client-side z snapshot posts
// bez dodatkowej kolekcji
```

### Firestore Indexes
```
COMPOSITE: posts → hashtags ARRAY_CONTAINS + createdAt DESC
```

### Priorytet: **P2**

---

## SYSTEM 7 — MENTIONY (@użytkownik)

### Stan aktualny
**Częściowo zaimplementowane.** Render @mention jako `<a>` z klikaniem. Brak lookup uid→username.

### Problem
Nie ma indeksu `username → uid`. Kliknięcie @nick nie otwiera profilu bo nie wiemy czyj to uid.

### Rozwiązanie
```
usernames/{username}   // NOWA kolekcja
  uid:       string
  username:  string
  createdAt: Timestamp
```

Przy rejestracji/zmianie nicku: `setDoc(db, 'usernames', username.toLowerCase(), { uid })`.

### Lookup flow
1. Użytkownik klika @nick
2. `getDoc('usernames', nick.toLowerCase())`
3. Pobierz uid → `openUserProfile(uid)`

### Firestore Rules
```
match /usernames/{username} {
  allow read:  if request.auth != null;
  allow write: if request.auth != null
               && request.auth.uid == request.resource.data.uid;
}
```

### Firestore Documents
```
usernames/{username_lowercase}
  uid:      string
  username: string
```

### Priorytet: **P2**

---

## SYSTEM 8 — UDOSTĘPNIANIE POSTÓW

### Cel
Przepisanie posta na własny feed z oznaczeniem autora oryginału.

### Opis działania
Kliknięcie "Udostępnij" → modal z opcjami:
1. Kopiuj link (clipboard) — ZAIMPLEMENTOWANE
2. Udostępnij na Arenie (nowy post z referencją do oryginału)
3. Wyślij przez Messenger (DM z linkiem)

### Nowa struktura posta-udostępnienia
```
posts/{autoId}
  // Standardowe pola autora udostępniającego:
  authorId, authorName, authorPhoto, authorRank
  content:           string  // opcjonalny komentarz przy udostępnieniu
  createdAt:         Timestamp
  // Pola udostępnienia:
  isShare:           true
  shareOf:           postId     // ID oryginalnego posta
  shareOfAuthorId:   uid
  shareOfAuthorName: string
  shareOfContent:    string     // kopia treści oryginału w momencie udostępnienia
  shareOfImageUrl:   string
  // Liczniki:
  reactions: {}, reactionsCount: 0, commentsCount: 0
```

### Aktualizacja oryginalnego posta
```
posts/{originalPostId}
  sharesCount: increment(1)  // NOWE POLE
```

### Nowa kolekcja (opcjonalna — dla deduplication)
```
shares/{sharerId_postId}   // ID deterministyczne
  sharerId:  uid
  postId:    string
  createdAt: Timestamp
```

### Render w feedzie
Post-udostępnienie wyświetla:
```
[Avatar shareFera] Imię Wojownika udostępnił post
  ┌─────────────────────────────────┐
  │ [Avatar oryginału] Autor        │
  │ Oryginalna treść...             │
  │ [Obrazek jeśli był]             │
  └─────────────────────────────────┘
```

### Powiadomienia
```
Typ: share
Ikona: ↻
Treść: "{name} udostępnił Twój post"
```

### Priorytet: **P2**

---

## SYSTEM 9 — ZDJĘCIA WIELOKROTNE

### Cel
Publikowanie do 10 zdjęć w jednym poście. Galeria swipeable.

### Struktura posta
```
posts/{postId}
  // Zamiast imageUrl (string) → imageUrls (array)
  images: [
    { url: string, publicId: string, width: number, height: number, order: number },
    ...
  ]
  imageCount: number  // 0-10
  
  // Zachowane dla kompatybilności wstecznej:
  imageUrl:         string  // = images[0].url
  imageStoragePath: string  // = images[0].publicId
```

### Cloudinary Requirements
- Folder: `posts/{uid}/` (wielokrotny upload)
- Każdy plik: max 5 MB, JPG/PNG/WebP/GIF
- Generuj miniatury: `c_fill,w_400,h_400,q_auto`
- Carousel thumbnail: `c_fill,w_200,h_200,q_auto`

### UI Component
- Compose box: multi-file input + preview strip (thumbnail 80×80px)
- Feed: carousel/slideshow z wskaźnikiem `1/3`
- Lightbox: swipe między zdjęciami

### Priorytet: **P3**

---

## SYSTEM 10 — GALERIE UŻYTKOWNIKA

### Cel
Strona z wszystkimi zdjęciami opublikowanymi przez użytkownika.

### Kolekcja
Brak nowej kolekcji. Query na istniejącej:
```
query(posts,
  where('authorId', '==', uid),
  where('imageUrl', '!=', ''),  // lub imageCount > 0
  orderBy('createdAt', 'desc')
)
```

### Wymagany indeks
```
COMPOSITE: posts → authorId ASC + imageUrl ASC + createdAt DESC
```

### Widok
- Zakładka "Galeria" na `profile.html` i `user.html`
- Grid 3-kolumnowy z miniaturami
- Kliknięcie → lightbox z nawigacją

### Cloudinary Requirements
Miniatury: `c_fill,w_300,h_300,q_auto,f_auto`

### Priorytet: **P3**

---

## SYSTEM 11 — GRUPY

### Cel
Zamknięte lub otwarte grupy tematyczne z własnym feedem.

### Collections
```
groups/{groupId}
  name:         string
  description:  string
  slug:         string      // URL-friendly, unikalny
  photoURL:     string
  bannerURL:    string
  createdBy:    uid
  membersCount: number
  isPrivate:    boolean
  category:     string      // sport, fitness, gaming...
  createdAt:    Timestamp

groupMembers/{groupId_uid}  // ID deterministyczne
  groupId:  string
  uid:      string
  role:     'member' | 'moderator' | 'admin'
  joinedAt: Timestamp

groupPosts/{autoId}
  groupId:   string
  // + standardowe pola posta
```

### Alternatywa: posty grupowe jako posts z polem groupId
```
posts/{postId}
  groupId: string | null  // NOWE POLE
```

**Rekomendacja: oddzielna kolekcja `groupPosts`** — łatwiejsze reguły, nie zaśmieca głównego feedu.

### Firestore Indexes
```
COMPOSITE: groupMembers → uid ASC + joinedAt DESC
COMPOSITE: groupPosts → groupId ASC + createdAt DESC
```

### Firestore Rules
```
match /groups/{groupId} {
  allow read:  if request.auth != null;
  allow write: if request.auth != null
               && get(/databases/.../groupMembers/$(groupId + '_' + request.auth.uid)).data.role
                  in ['admin', 'moderator'];
}
match /groupMembers/{docId} {
  allow read:  if request.auth != null;
  allow write: if request.auth != null;
}
match /groupPosts/{postId} {
  allow read:  if request.auth != null;
  allow create: if request.auth != null;
  allow update: if request.auth != null;
  allow delete: if request.auth != null
                && resource.data.authorId == request.auth.uid;
}
```

### XP Actions (nowe)
```
GROUP_POST_CREATED:  +8  XP
GROUP_POST_LIKED:    +2  XP
GROUP_JOINED:        +5  XP
```

### Powiadomienia
```
Typ: group_invite     — zaproszenie do grupy
Typ: group_new_post   — nowy post w grupie
Typ: group_joined     — ktoś dołączył do grupy (dla adminów)
```

### Priorytet: **P3 — ROADMAPA v2.0**

---

## SYSTEM 12 — WYDARZENIA

### Cel
Tworzenie i zarządzanie wydarzeniami sportowymi/fitness.

### Collections
```
events/{eventId}
  title:         string
  description:   string
  organizer:     uid
  organizerName: string
  location:      string
  locationUrl:   string  // Google Maps URL
  startAt:       Timestamp
  endAt:         Timestamp
  photoURL:      string
  maxAttendees:  number | null
  attendeesCount: number
  goingCount:    number
  interestedCount: number
  isOnline:      boolean
  streamUrl:     string
  category:      string
  createdAt:     Timestamp

eventAttendees/{eventId_uid}
  eventId:  string
  uid:      string
  status:   'going' | 'interested' | 'declined'
  joinedAt: Timestamp
```

### Firestore Indexes
```
COMPOSITE: events → startAt ASC
COMPOSITE: events → organizer ASC + startAt ASC
COMPOSITE: eventAttendees → uid ASC + status ASC
```

### Powiadomienia
```
Typ: event_invite      — zaproszenie na wydarzenie
Typ: event_reminder    — przypomnienie 24h przed
Typ: event_updated     — zmiana daty/miejsca
```

### XP Actions
```
EVENT_CREATED:   +15 XP
EVENT_JOINED:    +5  XP
```

### Priorytet: **P4 — ROADMAPA v2.0**

---

## SYSTEM 13 — TURNIEJE

### Cel
Organizacja turniejów z tablicą wyników i bracket systemem.

### Collections
```
tournaments/{tournamentId}
  title:         string
  description:   string
  organizer:     uid
  format:        'single_elimination' | 'round_robin' | 'league'
  maxParticipants: number
  participantsCount: number
  prizeXP:       number
  status:        'open' | 'active' | 'completed'
  startAt:       Timestamp
  endAt:         Timestamp
  createdAt:     Timestamp

tournamentParticipants/{tournamentId_uid}
  tournamentId: string
  uid:          string
  displayName:  string
  rank:         string
  joinedAt:     Timestamp

tournamentMatches/{matchId}
  tournamentId: string
  round:        number
  player1Id:    uid
  player2Id:    uid
  winner:       uid | null
  score1:       number
  score2:       number
  status:       'pending' | 'active' | 'completed'
  scheduledAt:  Timestamp
```

### XP Actions
```
TOURNAMENT_WIN:           +50 XP
TOURNAMENT_PARTICIPATION: +10 XP
TOURNAMENT_CHAMPION:      +200 XP
```

### Powiadomienia
```
Typ: tournament_match   — czas na mecz
Typ: tournament_result  — wynik meczu
Typ: tournament_win     — wygrałeś turniej
```

### Priorytet: **P4 — ROADMAPA v3.0**

---

## SYSTEM 14 — WYZWANIA SPOŁECZNOŚCIOWE

### Cel
Wyzwania grupowe gdzie wielu użytkowników rywalizuje w tym samym zadaniu.

### Stan aktualny
Istnieje `challenge-system.js` z 9 indywidualnymi wyzwaniami. System `duels.js` dla wyzwań 1:1.

### Nowe: Community Challenges
```
communityChallenges/{challengeId}
  title:         string
  description:   string
  badge:         string
  xpReward:      number
  targetCount:   number     // np. "1000 postów zbiorowo"
  currentCount:  number     // aktualne postępy
  participantsCount: number
  startAt:       Timestamp
  endAt:         Timestamp
  status:        'active' | 'completed'
  winnersCount:  number     // ile osób dostanie nagrodę

communityParticipants/{challengeId_uid}
  uid:           string
  contribution:  number     // ile dał od siebie
  joinedAt:      Timestamp
```

### XP Actions
```
COMMUNITY_CHALLENGE_JOINED:     +5  XP
COMMUNITY_CHALLENGE_COMPLETED:  +30 XP
COMMUNITY_CHALLENGE_WINNER:     +100 XP
```

### Priorytet: **P3 — ROADMAPA v2.0**

---

## SYSTEM 15 — ZRÓB LAGĘ PAJACU™

### Cel
Rozbudowany system wyzwań społecznościowych z humorem. Wojownik rzuca wyzwanie innemu wojownikowi.

### Statusy
```
pending    — wysłane, czeka na odpowiedź
accepted   — przyjęto wyzwanie
declined   — odrzucono
completed  — ukończono z wynikiem
expired    — minął czas (24h)
```

### Akcje
```
🍺 "Zrób Lagę Pajacu"   → tworzy wpis z status: pending
🔥 "Ciągnę, palę lamusie" → targetId zmienia status: accepted
🚫 "Temat skończony"      → zmiana status: declined (przez target)
                          → lub completed (przez initiator)
```

### Collections

#### pajacChallenge/{autoId}
```
initiatorId:      uid
initiatorName:    string
initiatorPhoto:   string
targetId:         uid
targetName:       string
targetPhoto:      string
action:           'laga_pajaca' | 'ognisko' | 'custom'
customText:       string  // własny opis wyzwania
status:           'pending' | 'accepted' | 'declined' | 'completed' | 'expired'
xpReward:         number  // dla wygrywającego
initiatorScore:   number | null
targetScore:      number | null
winner:           uid | null
expiresAt:        Timestamp  // createdAt + 24h
completedAt:      Timestamp | null
createdAt:        Timestamp
feedPost:         boolean  // czy pojawia się w feedzie
```

#### Opcjonalna tablica wyników (per para użytkowników)
```
pajacScores/{uid1_uid2}   // deterministyczne ID
  uid1:      string
  uid2:      string
  uid1Wins:  number
  uid2Wins:  number
  total:     number
  lastMatch: Timestamp
```

### XP Actions
```
PAJAC_SENT:      +2   XP (za inicjowanie)
PAJAC_ACCEPTED:  +2   XP (za przyjęcie wyzwania)
PAJAC_WON:       +25  XP (za wygraną)
PAJAC_COMPLETED: +10  XP (za ukończenie bez rozstrzygnięcia)
```

### Nowe osiągnięcia
```
first_pajac:     "Pierwszy Pajac" — zrób pierwsze wyzwanie
pajac_lord:      "Pajacowy Lord" — wygraj 10 wyzwań Lagi
laga_legend:     "Legenda Lagi" — wygraj 50 wyzwań
declined_master: "Temat Skończony" — odrzuć 5 wyzwań
five_fire:       "Pięć Ogni" — zaakceptuj 5 wyzwań "Ciągnę, palę lamusie"
```

### Powiadomienia
```
Typ: pajac_challenge    — "Masz wyzwanie Lagi od {name}! 🍺"
Typ: pajac_accepted     — "{name} przyjął Twoją Lagę! 🔥"
Typ: pajac_declined     — "{name}: Temat skończony 🚫"
Typ: pajac_completed    — "Wyzwanie ukończone! Wynik: {score}"
Typ: pajac_expired      — "Twoja Laga wygasła bez odpowiedzi"
```

### Feed
Zdarzenia Lagi pojawiają się w feedzie jako specjalne karty:
```
posts/{autoId}
  type: 'pajac_event'
  pajacId: string        // referencja do pajacChallenge
  // + standardowe pola posta
```

### Widoki
1. `user.html` — przycisk "🍺 Zrób Lagę Pajacu"
2. `index.html` — panel "Aktywne Lagi" (pending dla mnie)
3. `profile.html` — statystyki Lag (wygrane/przegrane/łącznie)
4. Feed — karta Lagi z przyciskami Akceptuj/Odrzuć

### Powiązanie z istniejącym poke.js
`poke.js` ma prosty mechanizm zaczepki (1 kliknięcie, cooldown 30min, +1 XP). System Lagi Pajacu to rozbudowany wariant z pełnym flow statusów. Oba mogą współistnieć — Poke = szybka zaczepka, Laga = formalne wyzwanie.

### Firestore Indexes
```
COMPOSITE: pajacChallenges → targetId ASC + status ASC + createdAt DESC
COMPOSITE: pajacChallenges → initiatorId ASC + status ASC + createdAt DESC
COMPOSITE: pajacChallenges → status ASC + expiresAt ASC
```

### Firestore Rules
```
match /pajacChallenges/{docId} {
  allow read: if request.auth != null
              && (resource.data.initiatorId == request.auth.uid
                  || resource.data.targetId == request.auth.uid);
  allow create: if request.auth != null
                && request.resource.data.initiatorId == request.auth.uid;
  allow update: if request.auth != null
                && (resource.data.initiatorId == request.auth.uid
                    || resource.data.targetId == request.auth.uid);
}
match /pajacScores/{docId} {
  allow read:  if request.auth != null;
  allow write: if request.auth != null;
}
```

### Priorytet: **P2 — WYMAGANA IMPLEMENTACJA**

---

## SYSTEM 16 — SYSTEM RAPORTOWANIA UŻYTKOWNIKÓW

### Cel
Mechanizm zgłaszania nieodpowiednich treści/użytkowników.

### Collections
```
reports/{autoId}
  reporterId:    uid
  targetType:    'user' | 'post' | 'comment' | 'message'
  targetId:      string     // uid lub postId/commentId
  targetAuthorId: uid
  reason:        'spam' | 'harassment' | 'hate_speech' | 'violence' | 'fake' | 'other'
  description:   string     // opcjonalny opis
  status:        'pending' | 'reviewed' | 'resolved' | 'dismissed'
  reviewedBy:    uid | null  // admin uid
  reviewedAt:    Timestamp | null
  createdAt:     Timestamp
```

### Reguły — ważne
```
match /reports/{docId} {
  allow create: if request.auth != null
                && request.resource.data.reporterId == request.auth.uid;
  allow read:   if false;  // TYLKO admini via Admin SDK / Cloud Functions
  allow update: if false;  // TYLKO admini
}
```

### Widoki
- Przycisk "..." → "Zgłoś" na każdym poście/komentarzu/profilu
- Modal z wyborem powodu + opcjonalnym opisem
- `admin.html` — panel moderatora (istniejący plik, do rozbudowy)

### Firestore Indexes
```
COMPOSITE: reports → status ASC + createdAt ASC
COMPOSITE: reports → targetType ASC + status ASC
```

### Priorytet: **P2**

---

## SYSTEM 17 — SYSTEM BLOKOWANIA UŻYTKOWNIKÓW

### Cel
Blokowanie niechcianych użytkowników: ukrycie postów, brak możliwości wiadomości.

### Collections
```
blocks/{blockerId_blockedId}   // deterministyczne ID
  blockerId:  uid
  blockedId:  uid
  createdAt:  Timestamp
```

### Logika blokowania
Po zablokowaniu uid B przez uid A:
1. Posty B znikają z feedu A (filtr po stronie klienta)
2. B nie może napisać wiadomości do A (sprawdzenie przed `setDoc` konwersacji)
3. B nie może komentować postów A
4. Profil A jest ukryty dla B

### Implementacja po stronie klienta
```
// Przy ładowaniu feedu:
const blockedIds = await getBlockedIds(myUid);
// Filtruj posty klienta: usuń posty od blockedIds

// Przy ładowaniu konwersacji:
// Przed getOrCreateConversation sprawdź blocks
```

### Firestore Rules
```
match /blocks/{docId} {
  allow read:   if request.auth != null
                && resource.data.blockerId == request.auth.uid;
  allow create: if request.auth != null
                && request.resource.data.blockerId == request.auth.uid;
  allow delete: if request.auth != null
                && resource.data.blockerId == request.auth.uid;
}
```

### Firestore Indexes
```
COMPOSITE: blocks → blockerId ASC + createdAt DESC
```

### Powiadomienia
Brak — blokowanie jest ciche.

### Priorytet: **P2**

---

## SYSTEM 18 — SYSTEM MODERACJI

### Cel
Narzędzia dla administratorów do zarządzania treścią.

### Rozbudowa admin.html
Istniejący plik `admin.html` wymaga podłączenia funkcji:
1. Lista zgłoszeń (z kolekcji `reports`)
2. Usuwanie postów przez admina
3. Banowanie użytkowników (ustawianie `users/{uid}.banned: true`)
4. Przegląd aktywności podejrzanych kont

### Nowe pole w users
```
users/{uid}
  banned:     boolean   // NOWE
  bannedAt:   Timestamp
  bannedBy:   uid       // admin uid
  banReason:  string
  isModerator: boolean  // NOWE — czy ma uprawnienia moderatora
```

### Firestore Rules modyfikacja
```
match /users/{uid} {
  allow read: if request.auth != null;
  allow update: if request.auth.uid == uid
                || get(/databases/.../users/$(request.auth.uid)).data.isModerator == true;
}
```

### Logika banned
```
// W checkAuth:
if (userData.banned) {
  auth.signOut();
  showToast("Twoje konto zostało zawieszone.", "error");
  redirect('login.html');
}
```

### Priorytet: **P3**

---

## SYSTEM 19 — ODZNAKI SPOŁECZNOŚCIOWE (ROZBUDOWA)

### Stan aktualny
Istnieje `weekly-ranking.js` z 6 odznakami: gaduła, kronikarz, lagowy_lord, streamer, rozpalacz, wojownik_tygodnia.

### Rozbudowa — nowe odznaki
```
// Społecznościowe
first_friend:       "Pierwszy Znajomy"     — pierwsza wzajemna obserwacja
connector:          "Konektor"             — 10 wzajemnych obserwacji
popular_warrior:    "Popularny Wojownik"   — 50 obserwujących
influencer:         "Influencer Areny"     — 200 obserwujących

// Aktywność
daily_warrior:      "Dzienny Wojownik"     — 7-dniowa seria logowań
iron_warrior:       "Żelazny Wojownik"     — 30-dniowa seria
legendary_presence: "Legendarna Obecność" — 100 dni łącznie

// Messenger
first_message:      "Pierwszy Przekaz"     — pierwsza wiadomość
chatterbox:         "Gaduła DM"            — 100 wiadomości

// Laga Pajacu
first_pajac:        "Pierwszy Pajac"       — pierwsze wyzwanie Lagi
pajac_lord:         "Pajacowy Lord"        — 10 wygranych Lag
```

### Przechowywanie odznak
```
users/{uid}
  badges: string[]   // tablica ID odznak (jak achievements[])
```

### Priorytet: **P2**

---

## SYSTEM 20 — MARKETPLACE WYZWAŃ

### Cel
Użytkownicy mogą publikować własne wyzwania dla społeczności.

### Collections
```
customChallenges/{challengeId}
  title:         string
  description:   string
  badge:         string    // emoji
  xpReward:      number    // 5-100, walidacja
  createdBy:     uid
  creatorName:   string
  difficulty:    'easy' | 'medium' | 'hard' | 'extreme'
  category:      string    // sport, fitness, diet, mental
  completionsCount: number
  likesCount:    number
  status:        'pending' | 'approved' | 'rejected'
  approvedBy:    uid | null
  createdAt:     Timestamp

customChallengeCompletions/{challengeId_uid}
  challengeId: string
  uid:         string
  completedAt: Timestamp
  proof:       string  // URL zdjęcia lub opis

customChallengeLikes/{challengeId_uid}
  challengeId: string
  uid:         string
```

### Flow moderacji
1. Użytkownik tworzy wyzwanie → status: `pending`
2. Moderator akceptuje → status: `approved` → pojawia się w marketplace
3. Odrzucenie → status: `rejected` + powód

### Firestore Indexes
```
COMPOSITE: customChallenges → status ASC + likesCount DESC
COMPOSITE: customChallenges → category ASC + status ASC + createdAt DESC
COMPOSITE: customChallenges → createdBy ASC + createdAt DESC
```

### Firestore Rules
```
match /customChallenges/{docId} {
  allow read:   if request.auth != null && resource.data.status == 'approved';
  allow create: if request.auth != null
                && request.resource.data.createdBy == request.auth.uid;
  allow update: if request.auth != null
                && (resource.data.createdBy == request.auth.uid
                    || get(/databases/.../users/$(request.auth.uid)).data.isModerator == true);
}
```

### XP Actions
```
CUSTOM_CHALLENGE_CREATED:   +5  XP
CUSTOM_CHALLENGE_COMPLETED: +varies (xpReward)
CUSTOM_CHALLENGE_LIKED:     +1  XP
```

### Priorytet: **P4 — ROADMAPA v2.0**

---

---

# RAPORT KOŃCOWY

---

## BRAKUJĄCE STRUKTURY — PODSUMOWANIE

### Brakujące kolekcje Firestore

| Kolekcja | System | Priorytet |
|---|---|---|
| `usernames` | Mentiony @nick | P2 |
| `pajacChallenges` | Laga Pajacu | P2 |
| `pajacScores` | Laga Pajacu (opcjonalna) | P3 |
| `shares` | Udostępnianie postów | P2 |
| `blocks` | Blokowanie użytkowników | P2 |
| `reports` | Raportowanie | P2 |
| `hashtagStats` | Trending hashtags (opcjonalna) | P3 |
| `groups` | Grupy | P3 |
| `groupMembers` | Grupy | P3 |
| `groupPosts` | Grupy | P3 |
| `events` | Wydarzenia | P4 |
| `eventAttendees` | Wydarzenia | P4 |
| `tournaments` | Turnieje | P4 |
| `tournamentParticipants` | Turnieje | P4 |
| `tournamentMatches` | Turnieje | P4 |
| `communityChallenges` | Wyzwania społecznościowe | P3 |
| `communityParticipants` | Wyzwania społecznościowe | P3 |
| `customChallenges` | Marketplace | P4 |
| `customChallengeCompletions` | Marketplace | P4 |

### Brakujące pola w istniejących kolekcjach

```
users/{uid}
  searchTokens:   string[]   // Wyszukiwarka
  badges:         string[]   // Odznaki społecznościowe
  banned:         boolean    // Moderacja
  bannedAt:       Timestamp
  bannedBy:       uid
  isModerator:    boolean    // Moderacja
  friendsCount:   number     // Znajomi (mutual follows)
  pajacWins:      number     // Laga Pajacu
  pajacLosses:    number
  pajacTotal:     number

posts/{postId}
  isShare:          boolean  // Udostępnianie
  shareOf:          string   // ID oryginału
  shareOfAuthorId:  uid
  shareOfAuthorName: string
  shareOfContent:   string
  sharesCount:      number
  visibility:       string   // public|followers|friends
  images:           Array    // Zdjęcia wielokrotne
  imageCount:       number
  pinned:           boolean  // Pinnowanie
  type:             string   // 'post'|'pajac_event'|'share'

followers/{autoId}
  mutual: boolean   // System znajomych
```

### Brakujące indeksy Firestore (nieistniejące)

```
posts → hashtags ARRAY_CONTAINS + createdAt DESC
posts → authorId ASC + imageUrl ASC + createdAt DESC
posts → pinned ASC + createdAt DESC
posts → visibility ASC + createdAt DESC

followers → followerId ASC + mutual ASC
followers → followingId ASC + mutual ASC

pajacChallenges → targetId ASC + status ASC + createdAt DESC
pajacChallenges → initiatorId ASC + status ASC + createdAt DESC
pajacChallenges → status ASC + expiresAt ASC

blocks → blockerId ASC + createdAt DESC
reports → status ASC + createdAt ASC
usernames → (brak indeksów, prosty lookup po ID)

customChallenges → status ASC + likesCount DESC
customChallenges → category ASC + status ASC + createdAt DESC
```

### Brakujące reguły Firestore

```
// Nowe kolekcje wymagają reguł:
pajacChallenges  — tylko uczestnicy mogą czytać/pisać
blocks           — tylko blockerId może czytać swoje blokady
reports          — tylko twórca może tworzyć, odczyt tylko dla adminów
usernames        — odczyt dla wszystkich, zapis tylko przez właściciela
customChallenges — odczyt tylko approved, tworzenie dla zalogowanych
groups           — odczyt publiczny, moderacja przez adminów grupy
```

### Brakujące XP_ACTIONS (rozbudowa xp.js)

```
PAJAC_SENT:               +2
PAJAC_ACCEPTED:           +2
PAJAC_WON:                +25
PAJAC_COMPLETED:          +10
GROUP_POST_CREATED:       +8
GROUP_JOINED:             +5
EVENT_CREATED:            +15
EVENT_JOINED:             +5
TOURNAMENT_WIN:           +50
TOURNAMENT_CHAMPION:      +200
COMMUNITY_CHALLENGE_WIN:  +100
CUSTOM_CHALLENGE_CREATED: +5
SHARE_POST:               +3
```

### Brakujące typy powiadomień (rozbudowa notifications.js)

```
friend_added     🤝
share            ↻
pajac_challenge  🍺
pajac_accepted   🔥
pajac_declined   🚫
pajac_completed  🏆
pajac_expired    ⏰
group_invite     👥
group_new_post   📢
event_invite     📅
event_reminder   ⏰
tournament_match ⚔️
tournament_win   🏆
report_resolved  ✅
```

### Brakujące pliki JS

```
js/search.js           — Wyszukiwarka użytkowników
js/pajac.js            — System Lagi Pajacu
js/blocks.js           — Blokowanie użytkowników
js/groups.js           — Grupy
js/events.js           — Wydarzenia
js/tournaments.js      — Turnieje
js/marketplace.js      — Marketplace wyzwań
js/community-challenges.js — Wyzwania społecznościowe
```

### Brakujące pliki HTML

```
search.html          — Wyszukiwarka
pajac.html           — Centrum Lag Pajacu
groups.html          — Lista grup
group.html           — Widok grupy
events.html          — Lista wydarzeń
event.html           — Widok wydarzenia
tournament.html      — Widok turnieju
marketplace.html     — Marketplace wyzwań
```

---

## ROADMAPY

---

### ROADMAPA DO WERSJI 1.0 (MVP Stabilny)
**Cel:** Stabilna, działająca aplikacja gotowa dla pierwszych użytkowników.  
**Szacowany czas:** 2-3 tygodnie

#### Sprint 1 — Stabilizacja (TYDZIEŃ 1)
```
✅ Firestore Rules — kompletne
✅ Firestore Indexes — kompletne
✅ Cloudinary — poprawna konfiguracja
✅ Debug logging — usunąć z produkcji
- Testy wszystkich modułów
- Bugfixes feedu, rankingu, messengera, profilu
```

#### Sprint 2 — Wyszukiwarka i Mentiony (TYDZIEŃ 2)
```
- search.js + search.html
- Kolekcja usernames
- Klik @mention → otwórz profil
- Pasek wyszukiwania w nav
```

#### Sprint 3 — Laga Pajacu i Blokowanie (TYDZIEŃ 3)
```
- pajac.js z pełnym flow statusów
- Kolekcja pajacChallenges
- Blokowanie użytkowników (blocks.js)
- Raportowanie (reports)
- Nowe powiadomienia: pajac_*, share, friend_added
```

---

### ROADMAPA DO WERSJI 2.0 (Pełny Portal Społecznościowy)
**Cel:** Funkcjonalność porównywalna z Facebookiem.  
**Szacowany czas:** 6-8 tygodni

#### Sprint 4 — Feed rozbudowany
```
- Udostępnianie postów (reshare) ze strukturą post-w-poście
- Hashtag stream (search.html?tag=X)
- Trending hashtags
- Widoczność postów (public/followers/friends)
- Galerie wielozdjęciowe
```

#### Sprint 5 — Znajomi i odznaki
```
- Logika mutual follows → "Znajomi"
- Widget "Może znasz?" na index.html
- Nowe odznaki: first_friend, connector, popular_warrior
- Panel odznak na profile.html
```

#### Sprint 6 — Grupy
```
- groups.html + group.html
- groups.js z CRUD
- Kolekcje: groups, groupMembers, groupPosts
- Moderacja grupowa
- Powiadomienia grupowe
```

#### Sprint 7 — Galerie i media
```
- Galeria użytkownika na profile.html
- Zdjęcia wielokrotne w poście
- Carousel/slideshow w feedzie
- Cloudinary transformacje dla miniatur
```

#### Sprint 8 — Marketplace wyzwań
```
- marketplace.html
- marketplace.js
- customChallenges z moderacją
- System oceniania wyzwań
```

---

### ROADMAPA DO WERSJI 3.0 (Platforma Eventowa)
**Cel:** Kompletna platforma sportowo-społecznościowa z wydarzeniami i turniejami.  
**Szacowany czas:** 8-12 tygodni

#### Sprint 9 — Wydarzenia
```
- events.html + event.html
- events.js
- Kolekcje: events, eventAttendees
- Integracja z Google Maps
- Powiadomienia i przypomnienia
```

#### Sprint 10 — Turnieje
```
- tournament.html
- tournaments.js
- Kolekcje: tournaments, tournamentParticipants, tournamentMatches
- Bracket generator
- Live scoring
```

#### Sprint 11 — Wyzwania społecznościowe
```
- communityChallenges.js
- Progress bar zbiorowy
- Leaderboard uczestników
- Ogłoszenie wyników w feedzie
```

#### Sprint 12 — Push Notifications (FCM)
```
- Firebase Cloud Messaging
- Service Worker: push handler (istnieje w sw.js)
- Tokeny FCM w users/{uid}.fcmTokens
- Serwer-side triggers (Cloud Functions lub własne rozwiązanie)
```

#### Sprint 13 — Moderacja zaawansowana
```
- Panel admin.html (rozbudowa)
- System banowania
- Masowe czyszczenie zgłoszeń
- Logi moderacji
```

#### Sprint 14 — Performance & PWA
```
- Full PWA (manifest.json już istnieje, sw.js już istnieje)
- Lazy loading modułów
- Infinite scroll optymalizacja
- Offline support
- App store deployment (Capacitor)
```

---

## DOKUMENT ARCHITEKTURY — PEŁNY SCHEMAT SYSTEMU

```
┌─────────────────────────────────────────────────────────────┐
│                  WEEKEND WARRIOR SOCIAL                     │
│                 Architektura Systemu v1.0                   │
└─────────────────────────────────────────────────────────────┘

FRONTEND (GitHub Pages)
│
├── HTML Pages
│   ├── index.html          ← Dashboard Areny
│   ├── feed.html           ← Kroniki (Feed 2.0)
│   ├── profile.html        ← Własny profil
│   ├── user.html           ← Publiczny profil
│   ├── ranking.html        ← Sala Chwały
│   ├── challenges.html     ← Misje
│   ├── achievements.html   ← Osiągnięcia
│   ├── messenger.html      ← DM
│   ├── login.html          ← Logowanie
│   ├── register.html       ← Rejestracja
│   ├── onboarding.html     ← Onboarding
│   ├── invite.html         ← Zaproszenia
│   ├── search.html         ← [BRAKUJE] Wyszukiwarka
│   ├── pajac.html          ← [BRAKUJE] Laga Pajacu
│   └── 404.html, offline.html, terms.html, privacy.html
│
├── JS Modules (ES Modules, CDN Firebase)
│   ├── firebase.js         ← Konfiguracja + COL + RANKS
│   ├── auth.js             ← Auth + User Management
│   ├── feed.js             ← Feed + Reakcje + @# + Tabs
│   ├── profile.js          ← Profil + Avatar Upload
│   ├── ranking.js          ← Ranking + Weekly
│   ├── challenges.js       ← Misje UI
│   ├── challenge-system.js ← Quiz + Wyzwania Engine
│   ├── duels.js            ← Pojedynki 1:1
│   ├── messenger.js        ← DM + Presence + Typing
│   ├── notifications.js    ← Powiadomienia realtime
│   ├── social.js           ← Follow + Invite + Profiles
│   ├── achievements.js     ← Osiągnięcia + Animacje
│   ├── xp.js               ← XP Engine
│   ├── arena.js            ← Efekty wizualne
│   ├── cloudinary.js       ← Upload Media
│   ├── media.js            ← Embeds YouTube/SoundCloud
│   ├── poke.js             ← Zaczepki (szybkie)
│   ├── weekly-ranking.js   ← Ranking tygodniowy + Odznaki
│   ├── sw.js               ← Service Worker (PWA)
│   ├── search.js           ← [BRAKUJE]
│   └── pajac.js            ← [BRAKUJE]
│
└── CSS
    ├── style.css           ← Design tokens + Global
    ├── rpg-theme.css       ← RPG Dark Fantasy theme
    ├── arena.css           ← Arena layout
    ├── challenges.css      ← Misje styles
    └── messenger.css       ← DM styles

FIREBASE AUTH
│
└── Providers: Email/Password + Google OAuth

FIRESTORE (Collections)
│
├── TIER 1 — CORE (istniejące, działające)
│   ├── users/{uid}
│   ├── posts/{postId}
│   ├── posts/{postId}/comments/{commentId}
│   ├── followers/{autoId}
│   ├── notifications/{uid}/items/{notifId}
│   ├── conversations/{convId}
│   ├── conversations/{convId}/messages/{msgId}
│   ├── pokes/{autoId}
│   ├── duels/{autoId}
│   ├── challenge_invites/{autoId}
│   ├── challenge_completions/{autoId}
│   └── weeklyScores/{weekId}/scores/{uid}
│
├── TIER 2 — V1.0 (do wdrożenia)
│   ├── usernames/{username}
│   ├── pajacChallenges/{autoId}
│   ├── pajacScores/{uid1_uid2}
│   ├── shares/{autoId}
│   ├── blocks/{blockerId_blockedId}
│   └── reports/{autoId}
│
├── TIER 3 — V2.0 (roadmapa)
│   ├── groups/{groupId}
│   ├── groupMembers/{groupId_uid}
│   ├── groupPosts/{autoId}
│   ├── hashtagStats/{tag}
│   ├── communityChallenges/{challengeId}
│   ├── communityParticipants/{challengeId_uid}
│   └── customChallenges/{challengeId}
│
└── TIER 4 — V3.0 (roadmapa)
    ├── events/{eventId}
    ├── eventAttendees/{eventId_uid}
    ├── tournaments/{tournamentId}
    ├── tournamentParticipants/{tournamentId_uid}
    └── tournamentMatches/{matchId}

CLOUDINARY
│
├── Foldery:
│   ├── avatars/{uid}/
│   ├── posts/{uid}/
│   └── dm/{uid}/
│
└── Konfiguracja:
    ├── Cloud Name: dxanfwb3l
    ├── Preset: wws_upload (unsigned)
    └── Transformacje: q_auto, f_auto, c_fill

XP ECOSYSTEM
│
├── Istniejące: POST(+10), LIKE(+2), COMMENT(+3), LOGIN(+5)
├── V1.0: PAJAC_WON(+25), SHARE(+3), FIRST_FRIEND(+10)
├── V2.0: GROUP_POST(+8), EVENT_JOINED(+5), COMMUNITY_WIN(+100)
└── V3.0: TOURNAMENT_WIN(+50), TOURNAMENT_CHAMPION(+200)

RANGI SYSTEM
│
├── Rookie:   0 pts     🥉
├── Warrior:  500 pts   🥈
├── Champion: 2000 pts  🥇
└── Legend:   10000 pts 💎

ACHIEVEMENTS (20 istniejących + plany)
│
├── V1.0: first_pajac, pajac_lord, laga_legend, first_friend
├── V2.0: connector, popular_warrior, influencer
└── V3.0: tournament_champion, community_hero
```

---

## KOLEJNOŚĆ WDROŻEŃ — MASTER PLAN

```
FAZA 0 — NAPRAWY KRYTYCZNE (AKTUALNIE)
  P0.1  firestore.rules — pełne reguły
  P0.2  cloudinary.js — poprawny cloud name
  P0.3  firestore.indexes.json — wszystkie indeksy
  P0.4  Testy wszystkich modułów

FAZA 1 — V1.0 (2-3 tygodnie)
  P1.1  search.js + search.html + kolekcja usernames
  P1.2  @mention lookup (klik → profil przez usernames)
  P1.3  pajac.js + pajacChallenges kolekcja
  P1.4  Laga Pajacu — flow statusów pending/accepted/declined/completed
  P1.5  blocks.js + kolekcja blocks
  P1.6  reports (przycisk Zgłoś na postach/profilach)
  P1.7  Nowe powiadomienia: pajac_*, share, friend_added
  P1.8  Nowe osiągnięcia: first_pajac, pajac_lord

FAZA 2 — V2.0 (6-8 tygodni)
  P2.1  Udostępnianie postów (reshare)
  P2.2  Hashtag stream (hashtag.html)
  P2.3  Mutual follows → "Znajomi"
  P2.4  Galeria użytkownika (zakładka na profile.html)
  P2.5  Zdjęcia wielokrotne w postach
  P2.6  Grupy (groups.js, groups.html, group.html)
  P2.7  Marketplace wyzwań
  P2.8  Nowe odznaki społecznościowe

FAZA 3 — V3.0 (8-12 tygodni)
  P3.1  Wydarzenia
  P3.2  Turnieje z bracket
  P3.3  Wyzwania społecznościowe (community)
  P3.4  Push Notifications (FCM)
  P3.5  Moderacja zaawansowana (admin panel)
  P3.6  Optymalizacja PWA + offline
  P3.7  Capacitor → iOS/Android
```

---

*Dokument wygenerowany przez Lead System Architect*  
*Weekend Warrior Social — Blueprint v1.0*  
*Data: 2025*
