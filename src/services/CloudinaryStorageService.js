/**
 * CloudinaryStorageService
 * 
 * Główny serwis do zarządzania wszystkimi uploadami i optymalizacją zasobów.
 * Jedynym miejscem gdzie aplikacja komunikuje się z Cloudinary.
 */

import {
  CLOUDINARY_CONFIG,
  CLOUDINARY_FOLDERS,
  CLOUDINARY_TRANSFORMS,
  UPLOAD_CONSTRAINTS,
} from '../config/cloudinary.config.js';
import { CloudinaryAsset } from '../models/CloudinaryAsset.js';

class CloudinaryStorageService {
  constructor() {
    if (!CLOUDINARY_CONFIG.CLOUD_NAME || !CLOUDINARY_CONFIG.UPLOAD_PRESET) {
      throw new Error('Cloudinary configuration is missing');
    }
    this.cloudName = CLOUDINARY_CONFIG.CLOUD_NAME;
    this.uploadPreset = CLOUDINARY_CONFIG.UPLOAD_PRESET;
    this.uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
    this.deliveryUrl = `https://res.cloudinary.com/${this.cloudName}`;
  }

  /**
   * Walidacja pliku przed uploadem
   */
  validateFile(file, maxSize = UPLOAD_CONSTRAINTS.MAX_IMAGE_SIZE) {
    if (!file) {
      throw new Error('Plik jest wymagany');
    }

    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      throw new Error(`Maksymalny rozmiar pliku to ${maxSizeMB}MB`);
    }

    const fileExtension = file.name.split('.').pop().toLowerCase();
    const isImageFormat = UPLOAD_CONSTRAINTS.ALLOWED_IMAGE_FORMATS.includes(
      fileExtension
    );
    const isVideoFormat = UPLOAD_CONSTRAINTS.ALLOWED_VIDEO_FORMATS.includes(
      fileExtension
    );

    if (!isImageFormat && !isVideoFormat) {
      throw new Error('Nieobsługiwany format pliku');
    }

    return true;
  }

  /**
   * Generuje FormData dla Cloudinary upload API
   */
  createFormData(file, folder, tags = []) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', folder);
    formData.append('tags', tags.join(','));
    formData.append('resource_type', 'auto');
    formData.append('access_mode', 'token');
    return formData;
  }

  /**
   * Uploaduje avatar użytkownika
   */
  async uploadAvatar(file, userId) {
    this.validateFile(file, UPLOAD_CONSTRAINTS.MAX_IMAGE_SIZE);

    const displayName = `avatar-${userId}-${Date.now()}`;
    const formData = this.createFormData(
      file,
      CLOUDINARY_FOLDERS.AVATARS,
      ['avatar', userId]
    );

    return this.performUpload(formData, displayName, { userId });
  }

  /**
   * Uploaduje zdjęcie do posta
   */
  async uploadPostImage(file, userId, postId) {
    this.validateFile(file, UPLOAD_CONSTRAINTS.MAX_IMAGE_SIZE);

    const displayName = `post-${postId}-${Date.now()}`;
    const formData = this.createFormData(
      file,
      CLOUDINARY_FOLDERS.POSTS,
      ['post', userId, postId]
    );

    return this.performUpload(formData, displayName, { userId, postId });
  }

  /**
   * Uploaduje zdjęcie wyzwania
   */
  async uploadChallengeImage(file, challengeId) {
    this.validateFile(file, UPLOAD_CONSTRAINTS.MAX_IMAGE_SIZE);

    const displayName = `challenge-${challengeId}-${Date.now()}`;
    const formData = this.createFormData(
      file,
      CLOUDINARY_FOLDERS.CHALLENGES,
      ['challenge', challengeId]
    );

    return this.performUpload(formData, displayName, { challengeId });
  }

  /**
   * Uploaduje story
   */
  async uploadStory(file, userId, storyId) {
    this.validateFile(file, UPLOAD_CONSTRAINTS.MAX_IMAGE_SIZE);

    const displayName = `story-${storyId}-${Date.now()}`;
    const formData = this.createFormData(
      file,
      CLOUDINARY_FOLDERS.STORIES,
      ['story', userId, storyId]
    );

    return this.performUpload(formData, displayName, { userId, storyId });
  }

  /**
   * Uploaduje video
   */
  async uploadVideo(file, userId, videoId) {
    this.validateFile(file, UPLOAD_CONSTRAINTS.MAX_VIDEO_SIZE);

    const displayName = `video-${videoId}-${Date.now()}`;
    const formData = this.createFormData(
      file,
      CLOUDINARY_FOLDERS.GALLERY,
      ['video', userId, videoId]
    );

    return this.performUpload(formData, displayName, { userId, videoId });
  }

  /**
   * Uploaduje załącznik do wiadomości/komentarza
   */
  async uploadAttachment(file, type = 'attachment') {
    this.validateFile(file, UPLOAD_CONSTRAINTS.MAX_FILE_SIZE);

    const displayName = `attachment-${Date.now()}`;
    const formData = this.createFormData(
      file,
      CLOUDINARY_FOLDERS.COMMENTS,
      [type, 'attachment']
    );

    return this.performUpload(formData, displayName, { type });
  }

  /**
   * Główna metoda uploadowania do Cloudinary
   */
  async performUpload(formData, displayName, metadata = {}) {
    try {
      const response = await fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const data = await response.json();

      const asset = new CloudinaryAsset({
        public_id: data.public_id,
        secure_url: data.secure_url,
        display_name: displayName,
        folder: data.folder,
        width: data.width,
        height: data.height,
        format: data.format,
        bytes: data.bytes,
        resource_type: data.resource_type,
        created_at: new Date().toISOString(),
        uploaded_by: metadata.userId || 'anonymous',
        metadata,
      });

      return asset;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Błąd uploadowania: ${error.message}`);
    }
  }

  /**
   * Usuwa zasób z Cloudinary
   */
  async deleteAsset(publicId) {
    if (!CLOUDINARY_CONFIG.API_KEY || !CLOUDINARY_CONFIG.API_SECRET) {
      console.warn('Cannot delete asset without API credentials');
      return false;
    }

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const destroyUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/destroy`;

      const formData = new FormData();
      formData.append('public_id', publicId);
      formData.append('timestamp', timestamp);
      // NOTE: Signature powinno być generowane z backendu
      // To jest uproszczona wersja - w produkcji użyć backendu

      const response = await fetch(destroyUrl, {
        method: 'POST',
        body: formData,
      });

      return response.ok;
    } catch (error) {
      console.error('Cloudinary delete error:', error);
      return false;
    }
  }

  /**
   * Generuje optymalizowany URL obrazu
   */
  getOptimizedImage(publicId, width = null, height = null) {
    let url = `${this.deliveryUrl}/image/upload/`;

    if (width && height) {
      url += `w_${width},h_${height},c_fill,g_auto,q_auto,f_auto/`;
    } else {
      const { quality, fetch_format, flags } = CLOUDINARY_TRANSFORMS.OPTIMIZATION;
      url += `q_${quality},f_${fetch_format},fl_${flags}/`;
    }

    url += publicId;

    return url;
  }

  /**
   * Generuje URL miniatury
   */
  getThumbnail(publicId, width = 150, height = 150) {
    const transform = CLOUDINARY_TRANSFORMS.THUMBNAIL;
    return (
      `${this.deliveryUrl}/image/upload/` +
      `w_${transform.width},h_${transform.height},c_${transform.crop},q_${transform.quality},f_${transform.fetch_format}/` +
      publicId
    );
  }

  /**
   * Generuje responsywny URL obrazu
   */
  getResponsiveImage(publicId, options = {}) {
    const {
      maxWidth = 1200,
      quality = 'auto',
      format = 'auto',
    } = options;

    return (
      `${this.deliveryUrl}/image/upload/` +
      `w_${maxWidth},q_${quality},f_${format},c_scale,dpr_auto/` +
      publicId
    );
  }

  /**
   * Generuje URL dla avatara
   */
  getAvatarUrl(publicId) {
    const transform = CLOUDINARY_TRANSFORMS.AVATAR;
    return (
      `${this.deliveryUrl}/image/upload/` +
      `w_${transform.width},h_${transform.height},c_${transform.crop},g_${transform.gravity},q_${transform.quality},f_${transform.fetch_format}/` +
      publicId
    );
  }

  /**
   * Generuje URL dla zdjęcia posta
   */
  getPostImageUrl(publicId) {
    const transform = CLOUDINARY_TRANSFORMS.POST_IMAGE;
    return (
      `${this.deliveryUrl}/image/upload/` +
      `w_${transform.width},h_${transform.height},c_${transform.crop},q_${transform.quality},f_${transform.fetch_format}/` +
      publicId
    );
  }

  /**
   * Generuje URL dla story
   */
  getStoryUrl(publicId) {
    const transform = CLOUDINARY_TRANSFORMS.STORY;
    return (
      `${this.deliveryUrl}/image/upload/` +
      `w_${transform.width},h_${transform.height},c_${transform.crop},q_${transform.quality},f_${transform.fetch_format}/` +
      publicId
    );
  }

  /**
   * Sprawdza dostępność Cloudinary
   */
  async healthCheck() {
    try {
      const response = await fetch(`${this.deliveryUrl}/image/upload/c_scale,w_10/blank.jpg`, {
        method: 'HEAD',
        mode: 'no-cors',
      });
      return response.ok || response.status === 0; // 0 = success w no-cors mode
    } catch (error) {
      console.error('Cloudinary health check failed:', error);
      return false;
    }
  }
}

// Singleton instance
const cloudinaryService = new CloudinaryStorageService();

export { cloudinaryService, CloudinaryStorageService };
