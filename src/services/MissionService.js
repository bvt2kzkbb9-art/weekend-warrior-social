/**
 * MissionService
 * 
 * Obsługuje operacje związane z misjami.
 */

import { firestoreService } from './FirestoreService.js';
import { cloudinaryService } from './CloudinaryStorageService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class MissionService {
  /**
   * Tworzy nową misję
   */
  async createMission(missionData, iconFile = null) {
    try {
      let iconAsset = null;

      if (iconFile) {
        iconAsset = await cloudinaryService.uploadAttachment(iconFile, 'mission-icon');
      }

      const missionDoc = {
        ...missionData,
        iconAssetId: iconAsset?.id || null,
        iconUrl: iconAsset?.secure_url || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // const docId = await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.MISSIONS,
      //   missionDoc
      // );

      return { id: missionData.id, ...missionDoc };
    } catch (error) {
      console.error('Error creating mission:', error);
      throw error;
    }
  }

  /**
   * Pobiera misje
   */
  async getMissions() {
    try {
      // const missions = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.MISSIONS,
      //   []
      // );
      // return missions;
    } catch (error) {
      console.error('Error fetching missions:', error);
      throw error;
    }
  }

  /**
   * Pobiera postęp misji użytkownika
   */
  async getUserMissionProgress(userId, missionId) {
    try {
      // const progress = await firestoreService.getDocument(
      //   `users/${userId}/missionProgress`,
      //   missionId
      // );
      // return progress;
    } catch (error) {
      console.error('Error fetching mission progress:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje postęp misji
   */
  async updateMissionProgress(userId, missionId, progress) {
    try {
      // await firestoreService.updateDocument(
      //   `users/${userId}/missionProgress`,
      //   missionId,
      //   { progress, updatedAt: new Date().toISOString() }
      // );
    } catch (error) {
      console.error('Error updating mission progress:', error);
      throw error;
    }
  }
}

// Singleton instance
const missionService = new MissionService();

export { missionService, MissionService };
