/**
 * UserService
 * 
 * Obsługuje operacje związane z użytkownikami.
 * Zarządza profilem, avatarami i ustawieniami.
 */

import { firestoreService } from './FirestoreService.js';
import { cloudinaryService } from './CloudinaryStorageService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class UserService {
  /**
   * Aktualizuje avatar użytkownika
   */
  async updateUserAvatar(userId, avatarFile) {
    try {
      const avatarAsset = await cloudinaryService.uploadAvatar(avatarFile, userId);

      // await firestoreService.updateDocument(
      //   FIRESTORE_COLLECTIONS.USERS,
      //   userId,
      //   {
      //     avatarAssetId: avatarAsset.id,
      //     avatarUrl: avatarAsset.secure_url,
      //     updatedAt: new Date().toISOString(),
      //   }
      // );

      return avatarAsset;
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  /**
   * Pobiera profil użytkownika
   */
  async getUserProfile(userId) {
    try {
      // const user = await firestoreService.getDocument(
      //   FIRESTORE_COLLECTIONS.USERS,
      //   userId
      // );
      // return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje profil użytkownika
   */
  async updateUserProfile(userId, profileData) {
    try {
      // await firestoreService.updateDocument(
      //   FIRESTORE_COLLECTIONS.USERS,
      //   userId,
      //   { ...profileData, updatedAt: new Date().toISOString() }
      // );
    } catch (error) {
      console.error('Error updating user profile:', error);
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
   * Otrzymuje powiadomienie
   */
  async sendNotification(userId, notification) {
    try {
      // const notificationDoc = {
      //   userId,
      //   ...notification,
      //   read: false,
      //   createdAt: new Date().toISOString(),
      // };
      // await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.NOTIFICATIONS,
      //   notificationDoc
      // );
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Pobiera powiadomienia użytkownika
   */
  async getUserNotifications(userId, limit = 20) {
    try {
      // const notifications = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.NOTIFICATIONS,
      //   [
      //     where('userId', '==', userId),
      //     orderBy('createdAt', 'desc'),
      //     limit(limit)
      //   ]
      // );
      // return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }
}

// Singleton instance
const userService = new UserService();

export { userService, UserService };
