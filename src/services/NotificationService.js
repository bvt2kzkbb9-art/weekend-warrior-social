/**
 * NotificationService
 * 
 * Obsługuje powiadomienia użytkowników.
 */

import { firestoreService } from './FirestoreService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class NotificationService {
  /**
   * Wysyła powiadomienie
   */
  async sendNotification(userId, type, data) {
    try {
      const notificationDoc = {
        userId,
        type,
        data,
        read: false,
        createdAt: new Date().toISOString(),
      };

      // const docId = await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.NOTIFICATIONS,
      //   notificationDoc
      // );

      return { id: `notif-${Date.now()}`, ...notificationDoc };
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Pobiera powiadomienia użytkownika
   */
  async getUserNotifications(userId, limit = 50) {
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

  /**
   * Oznacza powiadomienie jako przeczytane
   */
  async markAsRead(notificationId) {
    try {
      // await firestoreService.updateDocument(
      //   FIRESTORE_COLLECTIONS.NOTIFICATIONS,
      //   notificationId,
      //   { read: true }
      // );
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Usuwa powiadomienie
   */
  async deleteNotification(notificationId) {
    try {
      // await firestoreService.deleteDocument(
      //   FIRESTORE_COLLECTIONS.NOTIFICATIONS,
      //   notificationId
      // );
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

// Singleton instance
const notificationService = new NotificationService();

export { notificationService, NotificationService };
