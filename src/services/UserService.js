/**
 * UserService
 *
 * Obsługuje operacje związane z użytkownikami.
 * Zarządza profilem, avatarami i ustawieniami w Firestore.
 */

import { where, orderBy, limit } from 'firebase/firestore';
import { firestoreService } from './FirestoreService.js';
import { cloudinaryService } from './CloudinaryStorageService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class UserService {
  /**
   * Tworzy nowy profil użytkownika w Firestore
   */
  async createUserProfile(userId, initialData = {}) {
    try {
      const userProfile = {
        uid: userId,
        displayName: initialData.displayName || 'Wojownik',
        email: initialData.email || '',
        photoURL: '', // Cloudinary URL do avatara
        bannerURL: '', // Cloudinary URL do bannera
        level: 1,
        xp: 0,
        rank: 0,
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        status: 'online',
        bio: '',
        followers: 0,
        following: 0,
        posts: 0,
        stories: 0,
        completedChallenges: 0,
        activeChallenges: 0,
        settings: {
          emailNotifications: true,
          pushNotifications: true,
          privateProfile: false,
        },
      };

      await firestoreService.setDocument(FIRESTORE_COLLECTIONS.USERS, userId, userProfile);
      return userProfile;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  /**
   * Pobiera profil użytkownika
   */
  async getUserProfile(userId) {
    try {
      const user = await firestoreService.getDocument(
        FIRESTORE_COLLECTIONS.USERS,
        userId
      );
      return user;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje avatar użytkownika w Cloudinary i Firestore
   */
  async updateUserAvatar(userId, avatarFile) {
    try {
      const avatarAsset = await cloudinaryService.uploadAvatar(avatarFile, userId);

      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        {
          photoURL: avatarAsset.secure_url,
          updatedAt: new Date().toISOString(),
        }
      );

      return avatarAsset;
    } catch (error) {
      console.error('Error updating user avatar:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje banner profilu użytkownika
   */
  async updateUserBanner(userId, bannerFile) {
    try {
      const bannerAsset = await cloudinaryService.uploadPostImage(bannerFile, userId, `banner-${userId}`);

      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        {
          bannerURL: bannerAsset.secure_url,
          updatedAt: new Date().toISOString(),
        }
      );

      return bannerAsset;
    } catch (error) {
      console.error('Error updating user banner:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje profil użytkownika
   */
  async updateUserProfile(userId, profileData) {
    try {
      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        { ...profileData, updatedAt: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Aktualizuje lastLogin przy logowaniu
   */
  async updateUserLastLogin(userId) {
    try {
      await firestoreService.updateDocument(
        FIRESTORE_COLLECTIONS.USERS,
        userId,
        { lastLogin: new Date().toISOString() }
      );
    } catch (error) {
      console.error('Error updating last login:', error);
      // Nie wyrzucaj błędu, to nie jest krytyczne
      console.warn('Could not update last login timestamp');
    }
  }

  /**
   * Pobiera ranking użytkownika
   */
  async getUserRanking(userId) {
    try {
      const ranking = await firestoreService.getDocument(
        FIRESTORE_COLLECTIONS.RANKING,
        userId
      );
      return ranking;
    } catch (error) {
      console.error('Error fetching user ranking:', error);
      throw error;
    }
  }

  /**
   * Wysyła powiadomienie do użytkownika
   */
  async sendNotification(userId, notificationData) {
    try {
      const notificationDoc = {
        userId,
        ...notificationData,
        read: false,
        createdAt: new Date().toISOString(),
      };
      const docId = await firestoreService.addDocument(
        FIRESTORE_COLLECTIONS.NOTIFICATIONS,
        notificationDoc
      );
      return { id: docId, ...notificationDoc };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Pobiera powiadomienia użytkownika
   */
  async getUserNotifications(userId, limitCount = 20) {
    try {
      const notifications = await firestoreService.getCollection(
        FIRESTORE_COLLECTIONS.NOTIFICATIONS,
        [
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(limitCount),
        ]
      );
      return notifications;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Sprawdza czy nazwa użytkownika jest dostępna
   */
  async isDisplayNameAvailable(displayName) {
    try {
      const users = await firestoreService.getCollection(
        FIRESTORE_COLLECTIONS.USERS,
        [where('displayName', '==', displayName)]
      );
      return users.length === 0;
    } catch (error) {
      console.error('Error checking display name availability:', error);
      throw error;
    }
  }

  /**
   * Usuwa profil użytkownika (kasowanie konta)
   */
  async deleteUserProfile(userId) {
    try {
      const user = await this.getUserProfile(userId);

      // Usuń avatar z Cloudinary
      if (user.photoURL) {
        const photoPublicId = this.extractPublicIdFromUrl(user.photoURL);
        if (photoPublicId) {
          await cloudinaryService.deleteAsset(photoPublicId);
        }
      }

      // Usuń banner z Cloudinary
      if (user.bannerURL) {
        const bannerPublicId = this.extractPublicIdFromUrl(user.bannerURL);
        if (bannerPublicId) {
          await cloudinaryService.deleteAsset(bannerPublicId);
        }
      }

      // Usuń dokument użytkownika
      await firestoreService.deleteDocument(FIRESTORE_COLLECTIONS.USERS, userId);
    } catch (error) {
      console.error('Error deleting user profile:', error);
      throw error;
    }
  }

  /**
   * Ekstrahuje public_id z Cloudinary URL
   */
  extractPublicIdFromUrl(cloudinaryUrl) {
    try {
      const regex = /\/([^\/]+\/[^\/]+)$/;
      const match = cloudinaryUrl.match(regex);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}

// Singleton instance
const userService = new UserService();

export { userService, UserService };
