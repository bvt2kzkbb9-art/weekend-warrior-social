/**
 * Cloudinary Configuration
 * 
 * Centralny plik konfiguracji dla integracji z Cloudinary.
 * Wszystkie pliki aplikacji będą przechowywane w Cloudinary.
 */

const CLOUDINARY_CONFIG = {
  CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || '',
  UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '',
  API_KEY: import.meta.env.VITE_CLOUDINARY_API_KEY || '',
  API_SECRET: import.meta.env.VITE_CLOUDINARY_API_SECRET || '',
  SECURE: true,
};

const CLOUDINARY_FOLDERS = {
  AVATARS: 'weekend-warrior-social/avatars',
  POSTS: 'weekend-warrior-social/posts',
  STORIES: 'weekend-warrior-social/stories',
  COMMENTS: 'weekend-warrior-social/comments',
  CHALLENGES: 'weekend-warrior-social/challenges',
  CHALLENGE_CHAT: 'weekend-warrior-social/challenge-chat',
  MISSIONS: 'weekend-warrior-social/missions',
  ACHIEVEMENTS: 'weekend-warrior-social/achievements',
  BANNERS: 'weekend-warrior-social/banners',
  LOGOS: 'weekend-warrior-social/logos',
  GALLERY: 'weekend-warrior-social/gallery',
  TEMP: 'weekend-warrior-social/temp',
};

const CLOUDINARY_TRANSFORMS = {
  AVATAR: {
    width: 200,
    height: 200,
    crop: 'fill',
    gravity: 'face',
    quality: 'auto',
    fetch_format: 'auto',
  },
  THUMBNAIL: {
    width: 150,
    height: 150,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  },
  RESPONSIVE: {
    width: 'auto',
    crop: 'scale',
    quality: 'auto',
    fetch_format: 'auto',
    dpr: 'auto',
  },
  POST_IMAGE: {
    width: 600,
    height: 600,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  },
  STORY: {
    width: 1080,
    height: 1920,
    crop: 'fill',
    quality: 'auto',
    fetch_format: 'auto',
  },
  OPTIMIZATION: {
    quality: 'auto',
    fetch_format: 'auto',
    flags: 'progressive',
  },
};

const UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'],
  ALLOWED_VIDEO_FORMATS: ['mp4', 'webm', 'mov', 'avi', 'mkv'],
};

export {
  CLOUDINARY_CONFIG,
  CLOUDINARY_FOLDERS,
  CLOUDINARY_TRANSFORMS,
  UPLOAD_CONSTRAINTS,
};
