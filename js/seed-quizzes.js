/**
 * SEED QUIZÓW — WEEKEND WARRIOR SOCIAL
 * Dodaje quizy do Firestore zgodnie z systemem quiz.js
 */

import { db } from './firebase.js';
import { collection, addDoc } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

async function seedQuizzes() {
  const quizzes = [
    {
      id: 'hazard_math',
      title: 'Matematyka Hazardu',
      category: 'hazard',
      maxQuestions: 5,
      questions: [
        {
          question: 'Czy po 10 przegranych z rzędu szansa wygranej wzrasta?',
          answers: ['Tak', 'Nie'],
          correctIndex: 1,
          xp: 10,
          explanation: 'Każde losowanie jest niezależne.'
        },
        {
          question: 'Kto ma przewagę w kasynie?',
          answers: ['Gracz', 'Kasyno'],
          correctIndex: 1,
          xp: 10,
          explanation: 'Kasyno ma matematyczną przewagę w każdej grze.'
        }
      ]
    },

    {
      id: 'self_discipline',
      title: 'Samodyscyplina Wojownika',
      category: 'discipline',
      maxQuestions: 5,
      questions: [
        {
          question: 'Co daje większe szanse na sukces?',
          answers: ['Motywacja', 'Systematyczność'],
          correctIndex: 1,
          xp: 10,
          explanation: 'Systematyczność wygrywa z chwilową motywacją.'
        },
        {
          question: 'Czy mały krok wykonany codziennie jest lepszy od jednorazowego zrywu?',
          answers: ['Tak', 'Nie'],
          correctIndex: 0,
          xp: 10,
          explanation: 'Małe kroki budują trwały nawyk.'
        }
      ]
    },

    {
      id: 'personal_growth',
      title: 'Rozwój Osobisty Wojownika',
      category: 'growth',
      maxQuestions: 5,
      questions: [
        {
          question: 'Co jest pierwszym krokiem do rozwiązania problemu?',
          answers: ['Ignorowanie', 'Zauważenie problemu'],
          correctIndex: 1,
          xp: 15,
          explanation: 'Świadomość to pierwszy krok do zmiany.'
        },
        {
          question: 'Czy porażka może być źródłem wiedzy?',
          answers: ['Tak', 'Nie'],
          correctIndex: 0,
          xp: 15,
          explanation: 'Porażka to informacja zwrotna.'
        }
      ]
    },

    {
      id: 'lore_quiz',
      title: 'Fabuła Weekend Warrior',
      category: 'lore',
      maxQuestions: 5,
      questions: [
        {
          question: 'Kim jest Duch Areny?',
          answers: ['Władca smoków', 'Symbol celu i inspiracji'],
          correctIndex: 1,
          xp: 15,
          explanation: 'Duch Areny symbolizuje Twój najwyższy cel.'
        },
        {
          question: 'Co symbolizuje Hydra?',
          answers: ['Wiele problemów jednocześnie', 'Szczęście'],
          correctIndex: 0,
          xp: 15,
          explanation: 'Hydra to metafora wielu trudności naraz.'
        }
      ]
    }
  ];

  for (const quiz of quizzes) {
    await addDoc(collection(db, 'quizzes'), quiz);
    console.log(`Dodano quiz: ${quiz.title}`);
  }

  console.log('🔥 Wszystkie quizy zostały dodane!');
}

seedQuizzes();
