/**
 * RankingService
 * 
 * Obsługuje ranking użytkowników.
 */

import { firestoreService } from './FirestoreService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class RankingService {
  /**
   * Pobiera top ranking
   */
  async getTopRanking(limit = 100) {
    try {
      // const ranking = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.RANKING,
      //   [
      //     orderBy('xp', 'desc'),
      //     limit(limit)
      //   ]
      // );
      // return ranking;
    } catch (error) {
      console.error('Error fetching top ranking:', error);
      throw error;
    }
  }

  /**
   * Pobiera ranking użytkownika
   */
  async getUserRanking(userId) {
    try {
      // const ranking = await firestoreService.getDocument(
      //   FIRESTORE_COLLECTIONS.RANKING,
      //   userId
      // );
      // return ranking;
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje XP użytkownika
   */
  async updateUserXP(userId, xpAmount) {
    try {
      // await firestoreService.updateDocument(
      //   FIRESTORE_COLLECTIONS.RANKING,
      //   userId,
      //   {
      //     xp: increment(xpAmount),
      //     updatedAt: new Date().toISOString(),
      //   }
      // );
    } catch (error) {
      console.error('Error updating user XP:', error);
      throw error;
    }
  }

  /**
   * Pobiera pozycję użytkownika w rankingu
   */
  async getUserRankingPosition(userId) {
    try {
      // const userRanking = await this.getUserRanking(userId);
      // const topRanking = await this.getTopRanking(10000);
      // const position = topRanking.findIndex(r => r.userId === userId) + 1;
      // return position;
    } catch (error) {
      console.error('Error fetching user ranking position:', error);
      throw error;
    }
  }
}

// Singleton instance
const rankingService = new RankingService();

export { rankingService, RankingService };
