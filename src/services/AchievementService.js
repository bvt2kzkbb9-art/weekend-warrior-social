/**
 * AchievementService
 * 
 * Obsługuje osiągnięcia użytkowników.
 */

import { firestoreService } from './FirestoreService.js';
import { cloudinaryService } from './CloudinaryStorageService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class AchievementService {
  /**
   * Pobiera osiągnięcia użytkownika
   */
  async getUserAchievements(userId) {
    try {
      // const achievements = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.ACHIEVEMENTS,
      //   [where('userId', '==', userId)]
      // );
      // return achievements;
    } catch (error) {
      console.error('Error fetching user achievements:', error);
      throw error;
    }
  }

  /**
   * Odblokowuje osiągnięcie
   */
  async unlockAchievement(userId, achievementId) {
    try {
      // const achievementDoc = {
      //   userId,
      //   achievementId,
      //   unlockedAt: new Date().toISOString(),
      // };
      // await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.ACHIEVEMENTS,
      //   achievementDoc
      // );
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  /**
   * Sprawdza czy osiągnięcie jest już odblokowne
   */
  async isAchievementUnlocked(userId, achievementId) {
    try {
      // const achievements = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.ACHIEVEMENTS,
      //   [
      //     where('userId', '==', userId),
      //     where('achievementId', '==', achievementId)
      //   ]
      // );
      // return achievements.length > 0;
    } catch (error) {
      console.error('Error checking achievement:', error);
      throw error;
    }
  }
}

// Singleton instance
const achievementService = new AchievementService();

export { achievementService, AchievementService };
