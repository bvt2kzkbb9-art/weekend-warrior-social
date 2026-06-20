/**
 * ============================================================
 * WEEKEND WARRIOR SOCIAL — quizzes.js
 * Quiz System - Soldier's Knowledge Arena
 * Firebase SDK 10.12.2 | ES Modules
 * ============================================================
 *
 * Categories:
 *   - SZKOŁA WOJOWNIKA (Warrior School)
 *   - OSIEDLOWA MATEMATYKA (Neighborhood Math)
 *   - WĘŻE I HYDRY (Snakes & Hydras)
 *   - MĄDROŚCI ARENY (Arena Wisdom)
 *   - ŻYCIE WOJOWNIKA (Warrior Life)
 *   - LEGENDY WEEKEND WARRIOR (Weekend Warrior Legends)
 *
 * Exports:
 *   initQuizzesPage()  — initializes quizzes.html
 */

import {
  auth, db, COL, getRank, getLevel,
} from './firebase.js';

import {
  checkAuth, logout, getCurrentUserData, showToast,
} from './auth.js';

import { awardXP, XP_ACTIONS } from './xp.js';
import { checkAndUnlockAchievements } from './achievements.js';

import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  serverTimestamp,
} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';


// ════════════════════════════════════════════════════════════
// QUIZ QUESTIONS DATABASE
// ════════════════════════════════════════════════════════════

export const QUIZ_QUESTIONS = [
  // ── SZKOŁA WOJOWNIKA ──────────────────────────────────────
  {
    id: 'sw_01',
    category: 'Szkoła Wojownika',
    difficulty: 'easy',
    emoji: '⚔️',
    question: 'Widzisz problem od dwóch tygodni. Co robi prawdziwy wojownik?',
    answers: [
      { text: 'Udaje że go nie ma', correct: false },
      { text: 'Czeka aż sam zniknie', correct: false },
      { text: 'Bierze temat na klatę', correct: true },
      { text: 'Pisze o nim na grupie osiedlowej', correct: false },
    ],
    explanation: 'Hydra sama głowy nie straci. Wojownik staje do walki.',
  },
  {
    id: 'sw_02',
    category: 'Szkoła Wojownika',
    difficulty: 'easy',
    emoji: '⚔️',
    question: 'Masz wolne 15 minut. Co robisz?',
    answers: [
      { text: 'Scrollujesz bez celu', correct: false },
      { text: 'Zaczynasz odkładane zadanie', correct: true },
      { text: 'Patrzysz w sufit', correct: false },
      { text: 'Liczysz gołębie', correct: false },
    ],
    explanation: 'Każda minuta się liczy na arenie. 15 minut to czas na Mały Na Rozruch!',
  },

  // ── OSIEDLOWA MATEMATYKA ──────────────────────────────────
  {
    id: 'om_01',
    category: 'Osiedlowa Matematyka',
    difficulty: 'easy',
    emoji: '🧮',
    question: 'Masz 100 XP. Wydajesz 100 XP. Ile XP zostało?',
    answers: [
      { text: '100', correct: false },
      { text: '50', correct: false },
      { text: '0', correct: true },
      { text: 'Zależy od humoru', correct: false },
    ],
    explanation: '100 - 100 = 0. Nawet na arenie matematyka nie zmienia reguł.',
  },
  {
    id: 'om_02',
    category: 'Osiedlowa Matematyka',
    difficulty: 'medium',
    emoji: '🧮',
    question: 'Jeżeli 5 wojowników zdobyło po 20 XP, ile zdobyli razem?',
    answers: [
      { text: '50', correct: false },
      { text: '80', correct: false },
      { text: '100', correct: true },
      { text: '200', correct: false },
    ],
    explanation: '5 × 20 = 100 XP. Siła drużyny to suma jej wojowników!',
  },

  // ── WĘŻE I HYDRY ──────────────────────────────────────────
  {
    id: 'wh_01',
    category: 'Węże i Hydry',
    difficulty: 'easy',
    emoji: '🐍',
    question: 'Co symbolizuje wąż?',
    answers: [
      { text: 'Problem', correct: true },
      { text: 'Sąsiada', correct: false },
      { text: 'Kuriera', correct: false },
      { text: 'Gołębia', correct: false },
    ],
    explanation: 'Każdy wąż to przeszkoda, którą trzeba oswoić.',
  },
  {
    id: 'wh_02',
    category: 'Węże i Hydry',
    difficulty: 'medium',
    emoji: '🐉',
    question: 'Hydra oznacza:',
    answers: [
      { text: 'Jeden mały problem', correct: false },
      { text: 'Wiele problemów naraz', correct: true },
      { text: 'Darmowe XP', correct: false },
      { text: 'Sekretne wyzwanie', correct: false },
    ],
    explanation: 'Hydra to wielogłowy potwór. Każda głowa to inny problem, a razem tworzą większe zagrożenie.',
  },
  {
    id: 'wh_03',
    category: 'Węże i Hydry',
    difficulty: 'easy',
    emoji: '🏹',
    question: 'Co robi Łowca Węży?',
    answers: [
      { text: 'Szuka problemu', correct: true },
      { text: 'Kupuje miecz', correct: false },
      { text: 'Zbiera grzyby', correct: false },
      { text: 'Śpi', correct: false },
    ],
    explanation: 'Pierwszy krok to znalezienie węża. Nie można walczyć z tym czego nie widzisz.',
  },

  // ── MĄDROŚCI ARENY ────────────────────────────────────────
  {
    id: 'ma_01',
    category: 'Mądrości Areny',
    difficulty: 'easy',
    emoji: '💭',
    question: 'Co daje większą szansę na sukces?',
    answers: [
      { text: 'Jednorazowy zryw', correct: false },
      { text: 'Systematyczność', correct: true },
      { text: 'Szczęście', correct: false },
      { text: 'Narzekanie', correct: false },
    ],
    explanation: 'Mały krok każdego dnia to więcej niż wielki krok nigdy.',
  },
  {
    id: 'ma_02',
    category: 'Mądrości Areny',
    difficulty: 'medium',
    emoji: '⏰',
    question: 'Najlepszy moment na rozpoczęcie działania to:',
    answers: [
      { text: 'Jutro', correct: false },
      { text: 'W poniedziałek', correct: false },
      { text: 'Za miesiąc', correct: false },
      { text: 'Teraz', correct: true },
    ],
    explanation: 'Teraz jest zawsze najlepszy moment. Jutro nigdy się nie zaczyna.',
  },

  // ── ŻYCIE WOJOWNIKA ──────────────────────────────────────
  {
    id: 'zw_01',
    category: 'Życie Wojownika',
    difficulty: 'easy',
    emoji: '💪',
    question: 'Kolega rzuca Ci wyzwanie. Co robisz?',
    answers: [
      { text: 'Podejmuję walkę', correct: true },
      { text: 'Chowam się', correct: false },
      { text: 'Wyłączam internet', correct: false },
      { text: 'Udaję że nie widzę', correct: false },
    ],
    explanation: 'Wyzwanie to nie zagrożenie. To szansa na wzrost.',
  },
  {
    id: 'zw_02',
    category: 'Życie Wojownika',
    difficulty: 'medium',
    emoji: '🌧️',
    question: 'Masz słabszy dzień. Co robi wojownik?',
    answers: [
      { text: 'Rezygnuje', correct: false },
      { text: 'Robi choć mały krok', correct: true },
      { text: 'Kasuje konto', correct: false },
      { text: 'Obwinia pogodę', correct: false },
    ],
    explanation: 'Nawet 1% postępu to wciąż postęp. Arena nie czeka na idealne warunki.',
  },

  // ── LEGENDY WEEKEND WARRIOR ───────────────────────────────
  {
    id: 'lw_01',
    category: 'Legendy Weekend Warrior',
    difficulty: 'medium',
    emoji: '👑',
    question: 'Kto zostaje Legendą Areny?',
    answers: [
      { text: 'Ten który ma szczęście', correct: false },
      { text: 'Ten który nie odpuszcza', correct: true },
      { text: 'Ten który ma najwięcej znajomych', correct: false },
      { text: 'Ten który najgłośniej krzyczy', correct: false },
    ],
    explanation: 'Legenda to nie tytuł. To nagroda za konsystencję i determinację.',
  },
  {
    id: 'lw_02',
    category: 'Legendy Weekend Warrior',
    difficulty: 'hard',
    emoji: '🗡️',
    question: 'Najgroźniejszy przeciwnik wojownika to:',
    answers: [
      { text: 'Hydra', correct: false },
      { text: 'Wąż', correct: false },
      { text: 'Własne wymówki', correct: true },
      { text: 'Deszcz', correct: false },
    ],
    explanation: 'Każde zwycięstwo zaczyna się wewnątrz. Nie pokonasz zewnętrznego wroga, jeśli przegrywasz z samym sobą.',
  },
];

// ════════════════════════════════════════════════════════════
// XP & ACHIEVEMENT SYSTEM
// ════════════════════════════════════════════════════════════

export const QUIZ_XP = {
  CORRECT_ANSWER: 10,
  QUIZ_COMPLETED: 50,
  PERFECT_SCORE: 100,  // Bonus for 100% correct
};

export const QUIZ_BADGES = [
  {
    id: 'quiz_first',
    emoji: '🧠',
    name: 'Osiedlowy Filozof',
    desc: 'Ukończyłeś swój pierwszy quiz',
    check: (d) => (d.quizzesCompleted ?? 0) >= 1,
  },
  {
    id: 'quiz_ten',
    emoji: '⚔️',
    name: 'Mędrzec Areny',
    desc: 'Ukończyłeś 10 quizów',
    check: (d) => (d.quizzesCompleted ?? 0) >= 10,
  },
  {
    id: 'quiz_hundred',
    emoji: '👑',
    name: 'Profesor Hydry',
    desc: 'Odpowiedziałeś prawidłowo 100 razy',
    check: (d) => (d.quizCorrectAnswers ?? 0) >= 100,
  },
];

// ════════════════════════════════════════════════════════════
// STATE
// ════════════════════════════════════════════════════════════

let currentUser = null;
let currentUserData = null;
let currentQuiz = null;      // Quiz instance
let currentQuestionIndex = 0;
let selectedAnswer = null;
let showingResult = false;
let correctCount = 0;
let quiz = {
  questions: [],
  answers: [],      // User's answers: { questionId, selectedIndex, correct }
  startTime: null,
  endTime: null,
};

// ════════════════════════════════════════════════════════════
// INITIALIZATION
// ════════════════════════════════════════════════════════════

export function initQuizzesPage() {
  const TAG = '[initQuizzesPage]';
  console.log(TAG, '🚀 Start');

  checkAuth(async (user) => {
    currentUser = user;
    console.log(TAG, '✅ User:', user.uid);

    try {
      currentUserData = await getCurrentUserData(user.uid, user);
    } catch {
      currentUserData = null;
    }

    if (!currentUserData) {
      currentUserData = {
        uid: user.uid,
        displayName: user.displayName || 'Wojownik',
        points: 0,
        level: 1,
        rank: 'Rookie',
        quizzesCompleted: 0,
        quizCorrectAnswers: 0,
      };
    }

    setupUI();
    setupLogout();
  });
}

function setupUI() {
  const TAG = '[setupUI]';

  const startBtn = document.getElementById('start-quiz-btn');
  const retryBtn = document.getElementById('retry-quiz-btn');
  const menuBtn = document.getElementById('menu-quiz-btn');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      console.log(TAG, '▶️ Starting quiz');
      startNewQuiz();
    });
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      console.log(TAG, '🔄 Retrying quiz');
      startNewQuiz();
    });
  }

  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      console.log(TAG, '🏠 Back to menu');
      goToMenu();
    });
  }

  // Logout
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

function setupLogout() {
  document.getElementById('logout-btn')?.addEventListener('click', logout);
}

// ════════════════════════════════════════════════════════════
// QUIZ FLOW
// ════════════════════════════════════════════════════════════

function startNewQuiz() {
  const TAG = '[startNewQuiz]';
  console.log(TAG, '📝 Initializing new quiz');

  // Shuffle and select 10 random questions
  const shuffled = [...QUIZ_QUESTIONS].sort(() => Math.random() - 0.5).slice(0, 10);
  quiz = {
    questions: shuffled,
    answers: [],
    startTime: Date.now(),
    endTime: null,
  };

  currentQuestionIndex = 0;
  selectedAnswer = null;
  showingResult = false;
  correctCount = 0;

  // Hide menu, show quiz
  const menu = document.getElementById('quiz-menu');
  const screen = document.getElementById('quiz-screen');

  if (menu) menu.classList.add('hidden');
  if (screen) screen.classList.remove('hidden');

  renderQuestion();
}

function renderQuestion() {
  const TAG = '[renderQuestion]';

  if (currentQuestionIndex >= quiz.questions.length) {
    finishQuiz();
    return;
  }

  const q = quiz.questions[currentQuestionIndex];
  console.log(TAG, `Question ${currentQuestionIndex + 1}/10:`, q.question);

  // Update progress
  const progress = document.getElementById('quiz-progress');
  if (progress) {
    progress.textContent = `${currentQuestionIndex + 1}/${quiz.questions.length}`;
    const bar = document.getElementById('quiz-progress-bar');
    if (bar) {
      const pct = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
      bar.style.width = pct + '%';
      bar.setAttribute('aria-valuenow', pct);
    }
  }

  // Category badge
  const catBadge = document.getElementById('quiz-category');
  if (catBadge) {
    catBadge.innerHTML = `${q.emoji} ${q.category}`;
  }

  // Question text
  const qText = document.getElementById('quiz-question');
  if (qText) {
    qText.textContent = q.question;
  }

  // Answer buttons
  const container = document.getElementById('quiz-answers');
  if (container) {
    container.innerHTML = '';
    q.answers.forEach((answer, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-answer-btn';
      btn.setAttribute('data-index', idx);
      btn.innerHTML = escHtml(answer.text);
      btn.addEventListener('click', () => selectAnswer(idx, q));
      container.appendChild(btn);
    });
  }

  // Explanation (hidden)
  const explEl = document.getElementById('quiz-explanation');
  if (explEl) {
    explEl.textContent = '';
    explEl.classList.add('hidden');
  }

  // Next button (hidden)
  const nextBtn = document.getElementById('quiz-next-btn');
  if (nextBtn) {
    nextBtn.classList.add('hidden');
  }

  selectedAnswer = null;
  showingResult = false;
}

function selectAnswer(answerIndex, question) {
  const TAG = '[selectAnswer]';

  if (showingResult) return; // Already showing result
  selectedAnswer = answerIndex;

  // Record answer
  const isCorrect = question.answers[answerIndex].correct;
  quiz.answers.push({
    questionId: question.id,
    selectedIndex: answerIndex,
    correct: isCorrect,
  });

  if (isCorrect) correctCount++;

  // Visual feedback
  const btns = document.querySelectorAll('.quiz-answer-btn');
  btns.forEach((btn, idx) => {
    btn.disabled = true;
    if (idx === answerIndex) {
      if (isCorrect) {
        btn.classList.add('correct');
        playCorrectAnimation(btn);
        console.log(TAG, '✅ Correct!');
      } else {
        btn.classList.add('incorrect');
        playIncorrectAnimation(btn);
        console.log(TAG, '❌ Wrong!');
      }
    }
    // Show correct answer if user was wrong
    if (!isCorrect && question.answers[idx].correct) {
      btn.classList.add('correct-highlight');
    }
  });

  // Show explanation
  const explEl = document.getElementById('quiz-explanation');
  if (explEl) {
    explEl.textContent = question.explanation;
    explEl.classList.remove('hidden');
  }

  // Show next button
  const nextBtn = document.getElementById('quiz-next-btn');
  if (nextBtn) {
    nextBtn.classList.remove('hidden');
    nextBtn.addEventListener('click', nextQuestion, { once: true });
  }

  showingResult = true;
}

function nextQuestion() {
  currentQuestionIndex++;
  selectedAnswer = null;
  showingResult = false;
  renderQuestion();
}

async function finishQuiz() {
  const TAG = '[finishQuiz]';
  quiz.endTime = Date.now();

  console.log(TAG, `📊 Quiz finished: ${correctCount}/${quiz.questions.length} correct`);

  // Calculate XP
  let totalXP = 0;
  let bonusXP = 0;

  // Points for correct answers
  const correctXP = correctCount * QUIZ_XP.CORRECT_ANSWER;
  totalXP += correctXP;

  // Completion bonus
  totalXP += QUIZ_XP.QUIZ_COMPLETED;

  // Perfect score bonus
  if (correctCount === quiz.questions.length) {
    bonusXP = QUIZ_XP.PERFECT_SCORE;
    totalXP += bonusXP;
    console.log(TAG, `🎉 Perfect score! +${bonusXP} bonus XP`);
  }

  // Save to Firestore
  try {
    const userRef = doc(db, COL.USERS, currentUser.uid);
    await updateDoc(userRef, {
      quizzesCompleted: increment(1),
      quizCorrectAnswers: increment(correctCount),
      lastQuizDate: serverTimestamp(),
    });
    console.log(TAG, '✅ Quiz stats saved');
  } catch (err) {
    console.error(TAG, '⚠️ Could not save quiz stats:', err.message);
  }

  // Award XP
  try {
    await awardXP(currentUser.uid, {
      key: 'quiz_completed',
      xp: totalXP,
      label: 'Ukończono quiz',
    });
    console.log(TAG, `✅ Awarded ${totalXP} XP`);
  } catch (err) {
    console.error(TAG, '⚠️ Could not award XP:', err.message);
  }

  // Check and unlock achievements
  try {
    const updatedData = await getCurrentUserData(currentUser.uid, currentUser);
    if (updatedData) {
      await checkAndUnlockAchievements(currentUser.uid, updatedData);
    }
  } catch (err) {
    console.error(TAG, '⚠️ Could not check achievements:', err.message);
  }

  // Show results
  showResults(correctCount, quiz.questions.length, totalXP, bonusXP);
}

function showResults(correct, total, xpEarned, bonusXP) {
  const TAG = '[showResults]';
  console.log(TAG, `🏆 Showing results: ${correct}/${total}`);

  // Hide quiz screen
  const quizScreen = document.getElementById('quiz-screen');
  const resultsScreen = document.getElementById('quiz-results');

  if (quizScreen) quizScreen.classList.add('hidden');
  if (resultsScreen) resultsScreen.classList.remove('hidden');

  // Calculate percentage
  const percentage = Math.round((correct / total) * 100);

  // Determine title
  let title = 'Walka zawsze to doświadczenie';
  let emoji = '⚔️';
  if (percentage === 100) {
    title = 'Legenda! Idealna bitwa!';
    emoji = '👑';
  } else if (percentage >= 80) {
    title = 'Świetnie! Wojownik zwycięża!';
    emoji = '🏆';
  } else if (percentage >= 60) {
    title = 'Dobrze! Stajesz się silniejszy';
    emoji = '💪';
  }

  // Update results display
  const resultTitle = document.getElementById('result-title');
  if (resultTitle) resultTitle.innerHTML = `${emoji} ${title}`;

  const resultPercentage = document.getElementById('result-percentage');
  if (resultPercentage) resultPercentage.textContent = `${percentage}%`;

  const resultScore = document.getElementById('result-score');
  if (resultScore) resultScore.textContent = `${correct} z ${total}`;

  const resultXP = document.getElementById('result-xp');
  if (resultXP) {
    resultXP.textContent = `+${xpEarned} XP`;
    if (bonusXP > 0) {
      const bonus = document.getElementById('result-bonus');
      if (bonus) {
        bonus.innerHTML = `<span class="bonus-label">Bonus za ideał:</span> +${bonusXP} XP`;
        bonus.classList.remove('hidden');
      }
    }
  }

  // Render answer breakdown
  renderAnswerBreakdown();
}

function renderAnswerBreakdown() {
  const container = document.getElementById('answer-breakdown');
  if (!container) return;

  container.innerHTML = '';

  quiz.answers.forEach((answer, idx) => {
    const question = quiz.questions[idx];
    const div = document.createElement('div');
    div.className = 'answer-item';
    div.classList.add(answer.correct ? 'correct' : 'incorrect');

    const icon = answer.correct ? '✅' : '❌';
    const selectedText = escHtml(question.answers[answer.selectedIndex].text);

    div.innerHTML = `
      <div class="answer-item-header">
        <span class="answer-icon">${icon}</span>
        <span class="answer-question">${escHtml(question.question)}</span>
      </div>
      <div class="answer-item-body">
        <div class="your-answer">Twoja odpowiedź: ${selectedText}</div>
        ${!answer.correct ? `<div class="correct-answer">Prawidłowa: ${escHtml(question.answers.find(a => a.correct).text)}</div>` : ''}
      </div>
    `;

    container.appendChild(div);
  });
}

function goToMenu() {
  const menu = document.getElementById('quiz-menu');
  const screen = document.getElementById('quiz-screen');
  const results = document.getElementById('quiz-results');

  if (menu) menu.classList.remove('hidden');
  if (screen) screen.classList.add('hidden');
  if (results) results.classList.add('hidden');
}

// ════════════════════════════════════════════════════════════
// ANIMATIONS
// ════════════════════════════════════════════════════════════

function playCorrectAnimation(el) {
  el.style.animation = 'none';
  setTimeout(() => {
    el.style.animation = 'quiz-correct-bounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)';
  }, 10);
}

function playIncorrectAnimation(el) {
  el.style.animation = 'none';
  setTimeout(() => {
    el.style.animation = 'quiz-incorrect-shake 0.4s ease-in-out';
  }, 10);
}

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════

function escHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}
