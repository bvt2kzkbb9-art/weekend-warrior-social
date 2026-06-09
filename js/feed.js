import { db, COL, serverTimestamp, arrayUnion } from "./firebase.js";
import { collection, addDoc, query, orderBy, limit, onSnapshot, updateDoc, doc, deleteDoc, getDoc, getDocs, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";

export async function createPost(authorId, authorName, authorAvatar, content, imageUrl = "") {
  try {
    const docRef = await addDoc(collection(db, COL.POSTS), {
      authorId,
      authorName,
      authorAvatar,
      content,
      imageUrl,
      likes: [],
      reactions: {},
      commentsCount: 0,
      createdAt: serverTimestamp(),
    });

    showToast("✅ Post opublikowany", "success");
    return docRef.id;
  } catch (err) {
    showToast("❌ Błąd publikacji", "error");
    console.error("Create post error:", err);
    return null;
  }
}

export function loadFeed(callback) {
  const q = query(
    collection(db, COL.POSTS),
    orderBy("createdAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snap) => {
    const posts = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(posts);
  });
}

export async function likePost(postId, uid) {
  try {
    const postRef = doc(db, COL.POSTS, postId);
    await updateDoc(postRef, {
      likes: arrayUnion(uid),
    });
  } catch (err) {
    console.error("Like post error:", err);
  }
}

export async function unlikePost(postId, uid) {
  try {
    const postSnap = await getDoc(doc(db, COL.POSTS, postId));
    if (!postSnap.exists()) return;

    const likes = postSnap.data().likes || [];
    const filtered = likes.filter((id) => id !== uid);

    await updateDoc(doc(db, COL.POSTS, postId), {
      likes: filtered,
    });
  } catch (err) {
    console.error("Unlike post error:", err);
  }
}

export async function deletePost(postId, uid) {
  try {
    const postSnap = await getDoc(doc(db, COL.POSTS, postId));
    if (!postSnap.exists()) {
      showToast("❌ Post nie istnieje", "error");
      return false;
    }

    if (postSnap.data().authorId !== uid) {
      showToast("❌ Nie możesz usunąć tego posta", "error");
      return false;
    }

    await deleteDoc(doc(db, COL.POSTS, postId));
    showToast("✅ Post usunięty", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd usuwania", "error");
    console.error("Delete post error:", err);
    return false;
  }
}

export async function addComment(postId, authorId, authorName, content) {
  try {
    const commentRef = await addDoc(collection(db, COL.POSTS, postId, COL.COMMENTS), {
      authorId,
      authorName,
      content,
      createdAt: serverTimestamp(),
    });

    const postSnap = await getDoc(doc(db, COL.POSTS, postId));
    const currentCount = postSnap.data().commentsCount || 0;

    await updateDoc(doc(db, COL.POSTS, postId), {
      commentsCount: currentCount + 1,
    });

    showToast("✅ Komentarz dodany", "success");
    return commentRef.id;
  } catch (err) {
    showToast("❌ Błąd dodawania komentarza", "error");
    console.error("Add comment error:", err);
    return null;
  }
}

export function loadComments(postId, callback) {
  const q = query(
    collection(db, COL.POSTS, postId, COL.COMMENTS),
    orderBy("createdAt", "asc")
  );

  return onSnapshot(q, (snap) => {
    const comments = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(comments);
  });
}

export async function deleteComment(postId, commentId, uid) {
  try {
    const commentSnap = await getDoc(doc(db, COL.POSTS, postId, COL.COMMENTS, commentId));
    if (!commentSnap.exists()) {
      showToast("❌ Komentarz nie istnieje", "error");
      return false;
    }

    if (commentSnap.data().authorId !== uid) {
      showToast("❌ Nie możesz usunąć tego komentarza", "error");
      return false;
    }

    await deleteDoc(doc(db, COL.POSTS, postId, COL.COMMENTS, commentId));

    const postSnap = await getDoc(doc(db, COL.POSTS, postId));
    const currentCount = postSnap.data().commentsCount || 0;

    await updateDoc(doc(db, COL.POSTS, postId), {
      commentsCount: Math.max(0, currentCount - 1),
    });

    showToast("✅ Komentarz usunięty", "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd usuwania", "error");
    console.error("Delete comment error:", err);
    return false;
  }
}

export async function getPost(postId) {
  try {
    const snap = await getDoc(doc(db, COL.POSTS, postId));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (err) {
    console.error("Get post error:", err);
    return null;
  }
}
