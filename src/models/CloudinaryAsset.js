/**
 * CloudinaryAsset Model
 * 
 * Metadane zasobu przechowanego w Cloudinary.
 * Przechowywane w Firestore jako dokumenty.
 */

export class CloudinaryAsset {
  /**
   * @param {Object} data
   * @param {string} data.public_id - ID zasobu w Cloudinary
   * @param {string} data.secure_url - HTTPS URL do zasobu
   * @param {string} data.display_name - Nazwa wyświetlana
   * @param {string} data.folder - Folder w Cloudinary
   * @param {number} data.width - Szerokość (px)
   * @param {number} data.height - Wysokość (px)
   * @param {string} data.format - Format pliku (jpg, png, etc.)
   * @param {number} data.bytes - Rozmiar pliku (bajty)
   * @param {string} data.resource_type - Typ zasobu (image, video, raw)
   * @param {string} data.created_at - Data utworzenia (ISO 8601)
   * @param {string} data.uploaded_by - ID użytkownika
   * @param {Object} data.metadata - Dodatkowe metadane
   */
  constructor(data) {
    this.id = this.generateId();
    this.public_id = data.public_id;
    this.secure_url = data.secure_url;
    this.display_name = data.display_name || '';
    this.folder = data.folder;
    this.width = data.width || null;
    this.height = data.height || null;
    this.format = data.format;
    this.bytes = data.bytes;
    this.resource_type = data.resource_type;
    this.created_at = data.created_at || new Date().toISOString();
    this.uploaded_by = data.uploaded_by;
    this.metadata = data.metadata || {};
  }

  generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  toFirestoreDoc() {
    return {
      id: this.id,
      public_id: this.public_id,
      secure_url: this.secure_url,
      display_name: this.display_name,
      folder: this.folder,
      width: this.width,
      height: this.height,
      format: this.format,
      bytes: this.bytes,
      resource_type: this.resource_type,
      created_at: this.created_at,
      uploaded_by: this.uploaded_by,
      metadata: this.metadata,
      updatedAt: new Date().toISOString(),
    };
  }

  static fromFirestoreDoc(doc) {
    return new CloudinaryAsset({
      public_id: doc.public_id,
      secure_url: doc.secure_url,
      display_name: doc.display_name,
      folder: doc.folder,
      width: doc.width,
      height: doc.height,
      format: doc.format,
      bytes: doc.bytes,
      resource_type: doc.resource_type,
      created_at: doc.created_at,
      uploaded_by: doc.uploaded_by,
      metadata: doc.metadata,
    });
  }

  isImage() {
    return this.resource_type === 'image';
  }

  isVideo() {
    return this.resource_type === 'video';
  }

  getFileSize() {
    if (this.bytes < 1024) return `${this.bytes}B`;
    if (this.bytes < 1024 * 1024) return `${(this.bytes / 1024).toFixed(2)}KB`;
    return `${(this.bytes / (1024 * 1024)).toFixed(2)}MB`;
  }

  getDimensions() {
    if (!this.width || !this.height) return null;
    return { width: this.width, height: this.height };
  }
}
