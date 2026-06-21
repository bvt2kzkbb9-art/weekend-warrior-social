/**
 * ChallengeService
 *
 * Obsługuje logikę wyzwań.
 * Komunikuje się z FirestoreService i CloudinaryStorageService.
 */

import { where, orderBy } from 'firebase/firestore';
import { firestoreService } from './FirestoreService.js';
import { cloudinaryService } from './CloudinaryStorageService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class ChallengeService {
  /**
   * Tworzy nowe wyzwanie z opcjonalnym zasobem zdjęcia
   * @param {Object} challengeData - Dane wyzwania
   * @param {Object} imageAsset - Opcjonalny CloudinaryAsset (już załadowany)
   */
  async createChallenge(challengeData, imageAsset = null) {
    try {
      const challengeId = challengeData.id || `challenge-${Date.now()}`;

      const challengeDoc = {
        ...challengeData,
        id: challengeId,
        imagePublicId: imageAsset?.public_id || null,
        imageUrl: imageAsset?.secure_url || null,
        imageMetadata: imageAsset?.metadata || null,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const docId = await firestoreService.addDocument(
        FIRESTORE_COLLECTIONS.CHALLENGES,
        challengeDoc
      );

      return { id: docId, ...challengeDoc };
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  }

  /**
   * Pobiera wyzwanie po ID
   */
  async getChallenge(challengeId) {
    try {
      const challenge = await firestoreService.getDocument(
        FIRESTORE_COLLECTIONS.CHALLENGES,
        challengeId
      );
      return challenge;
    } catch (error) {
      console.error('Error fetching challenge:', error);
      throw error;
    }
  }

  /**
   * Pobiera wszystkie wyzwania użytkownika
   */
  async getUserChallenges(userId, status = null) {
    try {
      const constraints = [where('createdBy', '==', userId)];
      if (status) {
        constraints.push(where('status', '==', status));
      }
      const challenges = await firestoreService.getCollection(
        FIRESTORE_COLLECTIONS.CHALLENGES,
        constraints
      );
      return challenges;
    } catch (error) {
      console.error('Error fetching user challenges:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje status wyzwania
   */
  async updateChallengeStatus(challengeId, status) {
    try {
      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.CHALLENGES,
        challengeId,
        { status, updatedAt: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Error updating challenge status:', error);
      throw error;
    }
  }

  /**
   * Dodaje wiadomość do czatu wyzwania
   */
  async addChallengeMessage(challengeId, userId, text, attachmentAsset = null) {
    try {
      const messageDoc = {
        challengeId,
        userId,
        text,
        attachmentPublicId: attachmentAsset?.public_id || null,
        attachmentUrl: attachmentAsset?.secure_url || null,
        createdAt: new Date().toISOString(),
      };

      const docId = await firestoreService.addDocument(
        FIRESTORE_COLLECTIONS.CHALLENGE_MESSAGES,
        messageDoc
      );

      return { id: docId, ...messageDoc };
    } catch (error) {
      console.error('Error adding challenge message:', error);
      throw error;
    }
  }

  /**
   * Pobiera wiadomości wyzwania
   */
  async getChallengeMessages(challengeId) {
    try {
      const messages = await firestoreService.getCollection(
        FIRESTORE_COLLECTIONS.CHALLENGE_MESSAGES,
        [where('challengeId', '==', challengeId), orderBy('createdAt', 'asc')]
      );
      return messages;
    } catch (error) {
      console.error('Error fetching challenge messages:', error);
      throw error;
    }
  }

  /**
   * Rozlicza wynik wyzwania z nagrodą XP
   */
  async settleChallenge(challengeId, winnerId, loserId, winnerXP, loserXP) {
    try {
      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.CHALLENGES,
        challengeId,
        {
          status: 'completed',
          winnerId,
          loserId,
          winnerXP,
          loserXP,
          completedAt: new Date().toISOString(),
        }
      );
    } catch (error) {
      console.error('Error settling challenge:', error);
      throw error;
    }
  }

  /**
   * Usuwa wyzwanie
   */
  async deleteChallenge(challengeId) {
    try {
      const challenge = await this.getChallenge(challengeId);

      if (challenge?.imagePublicId) {
        await cloudinaryService.deleteAsset(challenge.imagePublicId);
      }

      await firestoreService.deleteDocument(
        FIRESTORE_COLLECTIONS.CHALLENGES,
        challengeId
      );
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  }
}

// Singleton instance
const challengeService = new ChallengeService();

export { challengeService, ChallengeService };
