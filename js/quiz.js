/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — quiz.js
 * System quizów fabularnych Wojowników
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Założenia:
 * - Quiz może być powiązany z wyzwaniem (challengeId) lub samodzielny (quizId).
 * - Pytania i odpowiedzi trzymane w kolekcji `quizzes`.
 * - Próby quizów trzymane w kolekcji `quizAttempts`.
 * - XP przyznawane wyłącznie przez awardXP() z xp.js.
 */

import { auth, db } from './firebase.js';
import { awardXP } from './xp.js';

import {
  doc,
  getDoc,
  addDoc,
  updateDoc,
  collection,
  increment,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// KONFIGURACJA XP DLA QUIZÓW
// ════════════════════════════════════════════════════════════

const QUIZ_XP = {
  CORRECT: {
    key:   'quiz_correct',
    xp:    10,
    label: 'Poprawna odpowiedź w quizie',
  },
  FINISHED: {
    key:   'quiz_finished',
    xp:    50,
    label: 'Ukończono quiz',
  },
  PERFECT: {
    key:   'quiz_perfect',
    xp:    100,
    label: 'Quiz ukończony bez błędów',
  },
};


// ════════════════════════════════════════════════════════════
// STAN QUIZU
// ════════════════════════════════════════════════════════════

let currentQuiz      = null;   // dokument quizu z Firestore
let currentQuestions = [];     // tablica pytań (po ewentualnym przetasowaniu)
let currentIndex     = 0;      // indeks aktualnego pytania
let answersLog       = [];     // [{ chosenIndex, correctIndex, isCorrect }]
let linkedChallengeId = null;  // jeśli quiz powiązany z wyzwaniem

let rootEl           = null;   // główny kontener quizu


// ════════════════════════════════════════════════════════════
// INICJALIZACJA STRONY QUIZU
// ════════════════════════════════════════════════════════════

/**
 * Inicjalizuje stronę quizu.
 * Oczekuje parametrów w URL:
 *   ?quizId=...        — konkretny quiz
 *   ?challengeId=...   — quiz powiązany z wyzwaniem
 *
 * Wywoływane automatycznie na DOMContentLoaded.
 */
export async function initQuizPage() {
  const TAG = '[quiz:initQuizPage]';

  try {
    const params      = new URLSearchParams(window.location.search);
    const quizId      = params.get('quizId');
    linkedChallengeId = params.get('challengeId');

    rootEl = document.querySelector('#quiz-root') || createRootContainer();

    if (!auth.currentUser) {
      renderError('Musisz być zalogowany, aby przejść próbę wiedzy.');
      return;
    }

    if (!quizId && !linkedChallengeId) {
      renderError('Brak wskazanego quizu. Wejdź tutaj z wyzwania lub Areny.');
      return;
    }

    // Jeśli mamy quizId — ładujemy konkretny quiz
    if (quizId) {
      await loadQuizById(quizId);
    } else {
      // Jeśli mamy tylko challengeId — szukamy quizu powiązanego z wyzwaniem
      await loadQuizForChallenge(linkedChallengeId);
    }

    if (!currentQuiz) {
      renderError('Duch Areny milczy. Nie znaleziono quizu.');
      return;
    }

    prepareQuestions();
    renderQuizShell();
    renderCurrentQuestion();

  } catch (err) {
    console.error(TAG, 'Błąd inicjalizacji quizu:', err);
    renderError('Coś poszło nie tak podczas ładowania próby wiedzy.');
  }
}


// Auto-init na stronie, jeśli skrypt jest załadowany jako moduł
document.addEventListener('DOMContentLoaded', () => {
  const isQuizPage = document.body?.dataset?.page === 'quiz'
    || document.querySelector('#quiz-root');

  if (isQuizPage) {
    initQuizPage().catch(() => {});
  }
});


// ════════════════════════════════════════════════════════════
// ŁADOWANIE QUIZU Z FIRESTORE
// ════════════════════════════════════════════════════════════

async function loadQuizById(quizId) {
  const TAG = '[quiz:loadQuizById]';

  try {
    const ref  = doc(db, 'quizzes', quizId);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      console.warn(TAG, 'Quiz nie istnieje:', quizId);
      return;
    }

    currentQuiz = {
      id:   snap.id,
      ...snap.data(),
    };

    console.log(TAG, 'Załadowano quiz:', currentQuiz.title);

  } catch (err) {
    console.error(TAG, 'Błąd ładowania quizu:', err);
  }
}


async function loadQuizForChallenge(challengeId) {
  const TAG = '[quiz:loadQuizForChallenge]';

  if (!challengeId) return;

  try {
    // Prosta wersja: quizId == challengeId
    // (jeśli chcesz bardziej złożone mapowanie, można dodać kolekcję "challengeQuizzes")
    await loadQuizById(challengeId);

    if (!currentQuiz) {
      console.warn(TAG, 'Brak quizu powiązanego z wyzwaniem:', challengeId);
    }

  } catch (err) {
    console.error(TAG, 'Błąd ładowania quizu dla wyzwania:', err);
  }
}


// ════════════════════════════════════════════════════════════
// PRZYGOTOWANIE PYTAŃ
// ════════════════════════════════════════════════════════════

function prepareQuestions() {
  const TAG = '[quiz:prepareQuestions]';

  if (!currentQuiz || !Array.isArray(currentQuiz.questions)) {
    console.warn(TAG, 'Brak pytań w quizie');
    currentQuestions = [];
    return;
  }

  // Kopia pytań
  currentQuestions = [...currentQuiz.questions];

  // Opcjonalne przetasowanie pytań
  shuffleArray(currentQuestions);

  // Można ograniczyć liczbę pytań (np. max 5)
  const MAX_QUESTIONS = currentQuiz.maxQuestions || 5;
  if (currentQuestions.length > MAX_QUESTIONS) {
    currentQuestions = currentQuestions.slice(0, MAX_QUESTIONS);
  }

  currentIndex = 0;
  answersLog   = [];
}


// ════════════════════════════════════════════════════════════
// RENDERING UI
// ════════════════════════════════════════════════════════════

function createRootContainer() {
  const el = document.createElement('div');
  el.id = 'quiz-root';
  document.body.appendChild(el);
  return el;
}


function renderQuizShell() {
  if (!rootEl) return;

  rootEl.innerHTML = `
    <div class="quiz-wrapper">
      <div class="quiz-header">
        <div class="quiz-title">Próba Wiedzy Wojownika</div>
        <div class="quiz-subtitle">
          Duch Areny obserwuje Twoje odpowiedzi.
        </div>
        <div class="quiz-progress">
          <span class="quiz-progress-label"></span>
        </div>
      </div>
      <div class="quiz-body">
        <div class="quiz-question-card">
          <div class="quiz-question-text"></div>
          <div class="quiz-answers"></div>
        </div>
      </div>
      <div class="quiz-footer">
        <button class="quiz-next-btn" disabled>Dalej</button>
      </div>
    </div>
  `;

  const nextBtn = rootEl.querySelector('.quiz-next-btn');
  nextBtn.addEventListener('click', handleNextClick, { passive: true });
}


function renderCurrentQuestion() {
  if (!rootEl || !currentQuestions.length) {
    renderError('Brak pytań w tej próbie wiedzy.');
    return;
  }

  const questionObj = currentQuestions[currentIndex];

  const progressLabel = rootEl.querySelector('.quiz-progress-label');
  const questionText  = rootEl.querySelector('.quiz-question-text');
  const answersWrap   = rootEl.querySelector('.quiz-answers');
  const nextBtn       = rootEl.querySelector('.quiz-next-btn');

  if (!questionObj || !progressLabel || !questionText || !answersWrap || !nextBtn) {
    return;
  }

  progressLabel.textContent = `Pytanie ${currentIndex + 1} / ${currentQuestions.length}`;
  questionText.textContent  = questionObj.question || '';

  answersWrap.innerHTML = '';
  nextBtn.disabled      = true;
  nextBtn.textContent   = currentIndex === currentQuestions.length - 1
    ? 'Zakończ próbę'
    : 'Dalej';

  const answers = Array.isArray(questionObj.answers) ? questionObj.answers : [];

  answers.forEach((answerText, idx) => {
    const btn = document.createElement('button');
    btn.className   = 'quiz-answer-btn';
    btn.textContent = answerText;
    btn.dataset.index = String(idx);

    btn.addEventListener('click', (ev) => {
      ev.preventDefault();
      handleAnswerClick(idx);
    }, { passive: false });

    answersWrap.appendChild(btn);
  });
}


function renderError(message) {
  if (!rootEl) rootEl = createRootContainer();

  rootEl.innerHTML = `
    <div class="quiz-error">
      <div class="quiz-error-title">Próba Wiedzy przerwana</div>
      <div class="quiz-error-message">${message}</div>
      <a href="challenges.html" class="quiz-error-back">Powrót na Arenę</a>
    </div>
  `;
}


function renderResultsView(stats) {
  if (!rootEl) return;

  const { correctCount, totalQuestions, xpFromQuestions, xpBonusFinished, xpBonusPerfect } = stats;

  const totalXp = xpFromQuestions + xpBonusFinished + xpBonusPerfect;

  rootEl.innerHTML = `
    <div class="quiz-results-wrapper">
      <div class="quiz-results-header">
        <div class="quiz-results-title">Próba Wiedzy Zakończona</div>
        <div class="quiz-results-subtitle">
          Duch Areny szepcze: Twoja wiedza rośnie jak płomień pochodni.
        </div>
      </div>
      <div class="quiz-results-body">
        <div class="quiz-results-stat">
          <span class="label">Poprawne odpowiedzi</span>
          <span class="value">${correctCount} / ${totalQuestions}</span>
        </div>
        <div class="quiz-results-stat">
          <span class="label">XP za odpowiedzi</span>
          <span class="value">+${xpFromQuestions} XP</span>
        </div>
        <div class="quiz-results-stat">
          <span class="label">Bonus za ukończenie</span>
          <span class="value">+${xpBonusFinished} XP</span>
        </div>
        <div class="quiz-results-stat">
          <span class="label">Bonus za perfekcję</span>
          <span class="value">+${xpBonusPerfect} XP</span>
        </div>
        <div class="quiz-results-total">
          Razem zdobyłeś <strong>+${totalXp} XP</strong>.
        </div>
      </div>
      <div class="quiz-results-footer">
        <a href="challenges.html" class="quiz-results-btn">Powrót na Arenę</a>
        <a href="profile.html" class="quiz-results-btn secondary">Zobacz swoje odznaki</a>
      </div>
    </div>
  `;
}


// ════════════════════════════════════════════════════════════
// OBSŁUGA ODPOWIEDZI
// ════════════════════════════════════════════════════════════

function handleAnswerClick(chosenIndex) {
  const TAG = '[quiz:handleAnswerClick]';

  const questionObj = currentQuestions[currentIndex];
  if (!questionObj) return;

  const correctIndex = typeof questionObj.correctIndex === 'number'
    ? questionObj.correctIndex
    : 0;

  const isCorrect = chosenIndex === correctIndex;

  // Zapisz odpowiedź w logu (nadpisz jeśli użytkownik zmieni wybór)
  answersLog[currentIndex] = {
    chosenIndex,
    correctIndex,
    isCorrect,
  };

  // Podświetlenie przycisków
  const answersWrap = rootEl.querySelector('.quiz-answers');
  const nextBtn     = rootEl.querySelector('.quiz-next-btn');
  if (!answersWrap || !nextBtn) return;

  answersWrap.querySelectorAll('.quiz-answer-btn').forEach((btn) => {
    const idx = Number(btn.dataset.index);
    btn.classList.remove('selected', 'correct', 'incorrect');

    if (idx === chosenIndex) {
      btn.classList.add('selected');
      if (isCorrect) {
        btn.classList.add('correct');
      } else {
        btn.classList.add('incorrect');
      }
    } else if (idx === correctIndex) {
      btn.classList.add('correct');
    }
  });

  nextBtn.disabled = false;

  console.log(TAG, `Pytanie ${currentIndex + 1}: ${isCorrect ? '✅ poprawna' : '❌ błędna'} odpowiedź`);
}


async function handleNextClick(ev) {
  ev.preventDefault();

  // Jeśli użytkownik nie odpowiedział — nic nie rób
  if (!answersLog[currentIndex]) return;

  const isLast = currentIndex === currentQuestions.length - 1;

  if (isLast) {
    await finishQuiz();
  } else {
    currentIndex += 1;
    renderCurrentQuestion();
  }
}


// ════════════════════════════════════════════════════════════
// ZAKOŃCZENIE QUIZU
// ════════════════════════════════════════════════════════════

async function finishQuiz() {
  const TAG = '[quiz:finishQuiz]';

  const user = auth.currentUser;
  if (!user) {
    renderError('Sesja wygasła. Zaloguj się ponownie, aby ukończyć próbę.');
    return;
  }

  const totalQuestions = currentQuestions.length;
  const correctCount   = answersLog.filter(a => a?.isCorrect).length;

  // XP za odpowiedzi
  const xpPerCorrect = QUIZ_XP.CORRECT.xp;
  const xpFromQuestions = correctCount * xpPerCorrect;

  // Bonusy
  const xpBonusFinished = QUIZ_XP.FINISHED.xp;
  const xpBonusPerfect  = correctCount === totalQuestions ? QUIZ_XP.PERFECT.xp : 0;

  // Przyznaj XP — używamy awardXP z własnymi akcjami
  try {
    for (let i = 0; i < correctCount; i++) {
      await awardXP(user.uid, QUIZ_XP.CORRECT);
    }

    await awardXP(user.uid, QUIZ_XP.FINISHED);

    if (xpBonusPerfect > 0) {
      await awardXP(user.uid, QUIZ_XP.PERFECT);
    }

  } catch (err) {
    console.warn(TAG, 'Błąd przyznawania XP za quiz:', err);
  }

  // Zapis próby do Firestore
  const attemptData = {
    userId:         user.uid,
    quizId:         currentQuiz?.id || null,
    challengeId:    linkedChallengeId || null,
    answers:        answersLog,
    correctCount,
    totalQuestions,
    xpFromQuestions,
    xpBonusFinished,
    xpBonusPerfect,
    xpEarned:       xpFromQuestions + xpBonusFinished + xpBonusPerfect,
    completedAt:    serverTimestamp(),
  };

  try {
    await addDoc(collection(db, 'quizAttempts'), attemptData);
  } catch (err) {
    console.warn(TAG, 'Błąd zapisu próby quizu:', err);
  }

  // Aktualizacja statystyk użytkownika (quizStats)
  try {
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      'quizStats.totalQuizzes':        increment(1),
      'quizStats.totalCorrectAnswers': increment(correctCount),
      lastQuizAt:                      serverTimestamp(),
    });
  } catch (err) {
    console.warn(TAG, 'Błąd aktualizacji quizStats użytkownika:', err);
  }

  // Render wyników
  const stats = {
    correctCount,
    totalQuestions,
    xpFromQuestions,
    xpBonusFinished,
    xpBonusPerfect,
  };

  renderResultsView(stats);
  console.log(TAG, 'Quiz zakończony:', stats);
}


// ════════════════════════════════════════════════════════════
// UTIL: LOSOWANIE
// ════════════════════════════════════════════════════════════

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j    = Math.floor(Math.random() * (i + 1));
    const temp = arr[i];
    arr[i]     = arr[j];
    arr[j]     = temp;
  }
  return arr;
}
