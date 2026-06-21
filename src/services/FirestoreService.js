/**
 * FirestoreService
 *
 * Abstrakcja dla komunikacji z Firestore.
 * Obsługuje wszystkie operacje na bazie danych.
 */

import {
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  runTransaction,
  collection as firestoreCollection,
  doc,
} from 'firebase/firestore';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class FirestoreService {
  constructor() {
    this.db = null;
    this.isInitialized = false;
  }

  /**
   * Inicjalizuje Firestore
   */
  initialize(firestoreDb) {
    this.db = firestoreDb;
    this.isInitialized = true;
    console.log('Firestore initialized');
  }

  /**
   * Sprawdza czy Firestore jest inicjalizowany
   */
  checkInitialized() {
    if (!this.isInitialized || !this.db) {
      throw new Error('Firestore is not initialized');
    }
  }

  /**
   * Dodaje dokument do kolekcji
   */
  async addDocument(collection, data) {
    this.checkInitialized();
    const docRef = await addDoc(firestoreCollection(this.db, collection), data);
    return docRef.id;
  }

  /**
   * Pobiera dokument po ID
   */
  async getDocument(collection, docId) {
    this.checkInitialized();
    const docRef = await getDoc(doc(this.db, collection, docId));
    return docRef.exists() ? docRef.data() : null;
  }

  /**
   * Pobiera wszystkie dokumenty z kolekcji
   */
  async getCollection(collection, queryConstraints = []) {
    this.checkInitialized();
    const q = query(firestoreCollection(this.db, collection), ...queryConstraints);
    const snapshots = await getDocs(q);
    return snapshots.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  /**
   * Aktualizuje dokument
   */
  async updateDocument(collection, docId, data) {
    this.checkInitialized();
    await updateDoc(doc(this.db, collection, docId), data);
  }

  /**
   * Usuwa dokument
   */
  async deleteDocument(collection, docId) {
    this.checkInitialized();
    await deleteDoc(doc(this.db, collection, docId));
  }

  /**
   * Batchodowe operacje zapisu
   */
  async batchWrite(operations) {
    this.checkInitialized();
    const batch = writeBatch(this.db);
    operations.forEach(op => {
      const { type, collection: coll, docId, data } = op;
      if (type === 'set') batch.set(doc(this.db, coll, docId), data);
      if (type === 'update') batch.update(doc(this.db, coll, docId), data);
      if (type === 'delete') batch.delete(doc(this.db, coll, docId));
    });
    await batch.commit();
  }

  /**
   * Nasłuchiwanie zmian w dokumentach (Real-time)
   */
  onDocumentChange(collection, docId, callback) {
    this.checkInitialized();
    return onSnapshot(doc(this.db, collection, docId), callback);
  }

  /**
   * Nasłuchiwanie zmian w kolekcji (Real-time)
   */
  onCollectionChange(collection, queryConstraints = [], callback) {
    this.checkInitialized();
    const q = query(firestoreCollection(this.db, collection), ...queryConstraints);
    return onSnapshot(q, callback);
  }

  /**
   * Tworzy transakcję
   */
  async transaction(updateFunction) {
    this.checkInitialized();
    return runTransaction(this.db, updateFunction);
  }
}

// Singleton instance
const firestoreService = new FirestoreService();

export { firestoreService, FirestoreService };
