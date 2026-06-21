/**
 * ChallengeService
 * 
 * Obsługuje logikę wyzwań.
 * Komunikuje się z FirestoreService i CloudinaryStorageService.
 */

import { firestoreService } from './FirestoreService.js';
import { cloudinaryService } from './CloudinaryStorageService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class ChallengeService {
  /**
   * Tworzy nowe wyzwanie z opcjonalnym zdjęciem
   */
  async createChallenge(challengeData, imageFile = null) {
    try {
      let challengeImageAsset = null;

      // Upload zdjęcia jeśli zostało dostarczone
      if (imageFile) {
        challengeImageAsset = await cloudinaryService.uploadChallengeImage(
          imageFile,
          challengeData.id
        );
      }

      // Przygotuj dokument wyzwania
      const challengeDoc = {
        ...challengeData,
        imageAssetId: challengeImageAsset?.id || null,
        imageUrl: challengeImageAsset?.secure_url || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Zapisz w Firestore
      // const docId = await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.CHALLENGES,
      //   challengeDoc
      // );

      return { id: challengeData.id, ...challengeDoc };
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
      // const challenge = await firestoreService.getDocument(
      //   FIRESTORE_COLLECTIONS.CHALLENGES,
      //   challengeId
      // );
      // return challenge;
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
      // let constraints = [where('participants', 'array-contains', userId)];
      // if (status) {
      //   constraints.push(where('status', '==', status));
      // }
      // const challenges = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.CHALLENGES,
      //   constraints
      // );
      // return challenges;
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
      // await firestoreService.updateDocument(
      //   FIRESTORE_COLLECTIONS.CHALLENGES,
      //   challengeId,
      //   { status, updatedAt: new Date().toISOString() }
      // );
    } catch (error) {
      console.error('Error updating challenge status:', error);
      throw error;
    }
  }

  /**
   * Dodaje wiadomość do czatu wyzwania
   */
  async addChallengeMessage(challengeId, userId, text, attachmentFile = null) {
    try {
      let attachmentAsset = null;

      if (attachmentFile) {
        attachmentAsset = await cloudinaryService.uploadAttachment(attachmentFile);
      }

      const messageDoc = {
        challengeId,
        userId,
        text,
        attachmentAssetId: attachmentAsset?.id || null,
        attachmentUrl: attachmentAsset?.secure_url || null,
        createdAt: new Date().toISOString(),
      };

      // const docId = await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.CHALLENGE_MESSAGES,
      //   messageDoc
      // );

      return { id: messageDoc.challengeId, ...messageDoc };
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
      // const messages = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.CHALLENGE_MESSAGES,
      //   [where('challengeId', '==', challengeId), orderBy('createdAt', 'asc')]
      // );
      // return messages;
    } catch (error) {
      console.error('Error fetching challenge messages:', error);
      throw error;
    }
  }

  /**
   * Rozlicza wynik wyzwania z nagrody XP
   */
  async settleChallenge(challengeId, winnerId, loserId, winnerXP, loserXP) {
    try {
      // Update challenge status i wyniki
      // await firestoreService.updateDocument(
      //   FIRESTORE_COLLECTIONS.CHALLENGES,
      //   challengeId,
      //   {
      //     status: 'completed',
      //     winnerId,
      //     loserId,
      //     winnerXP,
      //     loserXP,
      //     completedAt: new Date().toISOString(),
      //   }
      // );

      // Update users XP w ranking
      // await firestoreService.batchWrite([
      //   {
      //     type: 'update',
      //     collection: FIRESTORE_COLLECTIONS.RANKING,
      //     docId: winnerId,
      //     data: { xp: increment(winnerXP) }
      //   },
      //   {
      //     type: 'update',
      //     collection: FIRESTORE_COLLECTIONS.RANKING,
      //     docId: loserId,
      //     data: { xp: increment(loserXP) }
      //   }
      // ]);
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
      // Pobierz wyzwanie aby znaleźć zasoby do usunięcia
      // const challenge = await this.getChallenge(challengeId);
      // 
      // if (challenge.imageAssetId) {
      //   await cloudinaryService.deleteAsset(challenge.imageAssetId);
      // }
      // 
      // Usuń dokument
      // await firestoreService.deleteDocument(
      //   FIRESTORE_COLLECTIONS.CHALLENGES,
      //   challengeId
      // );
    } catch (error) {
      console.error('Error deleting challenge:', error);
      throw error;
    }
  }
}

// Singleton instance
const challengeService = new ChallengeService();

export { challengeService, ChallengeService };
