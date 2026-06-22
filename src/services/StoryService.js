/**
 * StoryService
 * 
 * Obsługuje operacje związane ze storiami.
 */

import { cloudinaryService } from './CloudinaryStorageService.js';
import { firestoreService } from './FirestoreService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class StoryService {
  /**
   * Tworzy nową historię
   */
  async createStory(userId, storyFile) {
    try {
      const storyId = `story-${Date.now()}`;
      const storyAsset = await cloudinaryService.uploadStory(storyFile, userId, storyId);

      const storyDoc = {
        userId,
        assetId: storyAsset.id,
        assetUrl: storyAsset.secure_url,
        resourceType: storyAsset.resource_type,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      // const docId = await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.STORIES,
      //   storyDoc
      // );

      return { id: storyId, ...storyDoc };
    } catch (error) {
      console.error('Error creating story:', error);
      throw error;
    }
  }

  /**
   * Pobiera historię
   */
  async getStories(limit = 50) {
    try {
      // const stories = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.STORIES,
      //   [
      //     where('expiresAt', '>', new Date().toISOString()),
      //     orderBy('createdAt', 'desc'),
      //     limit(limit)
      //   ]
      // );
      // return stories;
    } catch (error) {
      console.error('Error fetching stories:', error);
      throw error;
    }
  }

  /**
   * Usuwa historię
   */
  async deleteStory(storyId) {
    try {
      // const story = await firestoreService.getDocument(
      //   FIRESTORE_COLLECTIONS.STORIES,
      //   storyId
      // );
      //
      // if (story.assetId) {
      //   await cloudinaryService.deleteAsset(story.assetId);
      // }
      //
      // await firestoreService.deleteDocument(
      //   FIRESTORE_COLLECTIONS.STORIES,
      //   storyId
      // );
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }
}

// Singleton instance
const storyService = new StoryService();

export { storyService, StoryService };
