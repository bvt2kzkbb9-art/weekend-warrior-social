/**
 * PostService
 * 
 * Obsługuje operacje związane z postami.
 * Zarządza tworzeniem, edycją i usuwaniem postów.
 */

import { firestoreService } from './FirestoreService.js';
import { cloudinaryService } from './CloudinaryStorageService.js';
import { FIRESTORE_COLLECTIONS } from '../config/firebase.config.js';

class PostService {
  /**
   * Tworzy nowy post z opcjonalnym zdjęciem
   */
  async createPost(userId, content, imageFile = null) {
    try {
      let imageAsset = null;

      if (imageFile) {
        const postId = `post-${Date.now()}`;
        imageAsset = await cloudinaryService.uploadPostImage(imageFile, userId, postId);
      }

      const postDoc = {
        userId,
        content,
        imageAssetId: imageAsset?.id || null,
        imageUrl: imageAsset?.secure_url || null,
        likes: 0,
        comments: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // const docId = await firestoreService.addDocument(
      //   FIRESTORE_COLLECTIONS.POSTS,
      //   postDoc
      // );

      return { id: `post-${Date.now()}`, ...postDoc };
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Pobiera posty z feed'u
   */
  async getFeedPosts(userId, limit = 20) {
    try {
      // const posts = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.POSTS,
      //   [
      //     orderBy('createdAt', 'desc'),
      //     limit(limit)
      //   ]
      // );
      // return posts;
    } catch (error) {
      console.error('Error fetching feed posts:', error);
      throw error;
    }
  }

  /**
   * Pobiera posty użytkownika
   */
  async getUserPosts(userId, limit = 20) {
    try {
      // const posts = await firestoreService.getCollection(
      //   FIRESTORE_COLLECTIONS.POSTS,
      //   [
      //     where('userId', '==', userId),
      //     orderBy('createdAt', 'desc'),
      //     limit(limit)
      //   ]
      // );
      // return posts;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  }

  /**
   * Usuwa post
   */
  async deletePost(postId) {
    try {
      // Pobierz post aby znaleźć zasoby do usunięcia
      // const post = await firestoreService.getDocument(
      //   FIRESTORE_COLLECTIONS.POSTS,
      //   postId
      // );
      //
      // if (post.imageAssetId) {
      //   await cloudinaryService.deleteAsset(post.imageAssetId);
      // }
      //
      // await firestoreService.deleteDocument(
      //   FIRESTORE_COLLECTIONS.POSTS,
      //   postId
      // );
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  }
}

// Singleton instance
const postService = new PostService();

export { postService, PostService };
