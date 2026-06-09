import { db, COL, serverTimestamp } from "./firebase.js";
import { collection, addDoc, query, where, getDocs, updateDoc, doc, getDoc, onSnapshot, orderBy, limit, arrayUnion } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { showToast } from "./auth.js";
import { createNotification } from "./notifications.js";

const QUIZZES = [
  {
    id: "quiz-1",
    title: "Fitness Basics",
    questions: [
      {
        id: "q1",
        question: "Ile mięśni ma ludzkie ciało?",
        answers: ["206", "406", "606", "806"],
        correctAnswer: 1,
        xp: 10,
      },
      {
        id: "q2",
        question: "Ile czasu powinno trwać ćwiczenie kardio dziennie?",
        answers: ["15 minut", "30 minut", "1 godzina", "2 godziny"],
        correctAnswer: 1,
        xp: 10,
      },
    ],
    totalXp: 20,
  },
];

export function getQuiz(id) {
  return QUIZZES.find((q) => q.id === id) || null;
}

export async function startQuiz(uid, quizId) {
  try {
    const quiz = getQuiz(quizId);
    if (!quiz) {
      showToast("❌ Quiz nie istnieje", "error");
      return null;
    }

    const quizRef = await addDoc(collection(db, COL.CHALLENGES), {
      uid,
      type: "quiz",
      quizId,
      quizTitle: quiz.title,
      status: "in-progress",
      answers: [],
      createdAt: serverTimestamp(),
      completedAt: null,
    });

    return quizRef.id;
  } catch (err) {
    showToast("❌ Błąd uruchomienia quizu", "error");
    console.error("Start quiz error:", err);
    return null;
  }
}

export async function submitQuizAnswer(uid, quizId, questionId, answerIndex) {
  try {
    const q = query(
      collection(db, COL.CHALLENGES),
      where("uid", "==", uid),
      where("quizId", "==", quizId),
      where("status", "==", "in-progress")
    );
    const snap = await getDocs(q);
    if (snap.empty) {
      showToast("❌ Quiz nie znaleziony", "error");
      return false;
    }

    const docRef = snap.docs[0].ref;
    await updateDoc(docRef, {
      answers: arrayUnion({ questionId, answerIndex }),
    });

    return true;
  } catch (err) {
    showToast("❌ Błąd wysyłania odpowiedzi", "error");
    console.error("Submit answer error:", err);
    return false;
  }
}

export async function completeQuiz(uid, quizProgressId, quiz) {
  try {
    const quizSnap = await getDoc(doc(db, COL.CHALLENGES, quizProgressId));
    if (!quizSnap.exists()) {
      showToast("❌ Quiz nie istnieje", "error");
      return false;
    }

    const answers = quizSnap.data().answers || [];
    let correctCount = 0;

    quiz.questions.forEach((question) => {
      const userAnswer = answers.find((a) => a.questionId === question.id);
      if (userAnswer && userAnswer.answerIndex === question.correctAnswer) {
        correctCount++;
      }
    });

    const totalXp = Math.floor((correctCount / quiz.questions.length) * quiz.totalXp);

    await updateDoc(doc(db, COL.CHALLENGES, quizProgressId), {
      status: "completed",
      completedAt: serverTimestamp(),
      correctCount,
      totalQuestions: quiz.questions.length,
      xpEarned: totalXp,
    });

    const userSnap = await getDoc(doc(db, COL.USERS, uid));
    const currentPoints = userSnap.data().points || 0;

    await updateDoc(doc(db, COL.USERS, uid), {
      points: currentPoints + totalXp,
    });

    showToast(`✅ Quiz ukończony! +${totalXp} XP (${correctCount}/${quiz.questions.length})`, "success");
    return true;
  } catch (err) {
    showToast("❌ Błąd ukończenia quizu", "error");
    console.error("Complete quiz error:", err);
    return false;
  }
}

export function loadUserQuizzes(uid, callback) {
  const q = query(
    collection(db, COL.CHALLENGES),
    where("uid", "==", uid),
    where("type", "==", "quiz"),
    orderBy("createdAt", "desc")
  );

  return onSnapshot(q, (snap) => {
    const quizzes = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    callback(quizzes);
  });
}

export async function getQuizRanking() {
  try {
    const q = query(
      collection(db, COL.USERS),
      orderBy("points", "desc"),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((doc) => ({ uid: doc.id, ...doc.data() }));
  } catch (err) {
    console.error("Get quiz ranking error:", err);
    return [];
  }
}
