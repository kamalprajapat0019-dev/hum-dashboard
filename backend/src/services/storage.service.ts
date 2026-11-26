import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

/**
 * Storage Provider Options
 * Default: 'local' (Local file system storage under /uploads)
 * Pluggable: 's3' (AWS S3), 'gcs' (Google Cloud Storage), 'r2' (Cloudflare R2)
 */
export type StorageProvider = 'local' | 's3' | 'gcs' | 'r2';

export type AssetCategory = 'PHOTO' | 'DOCUMENT';

/**
 * Server-Side Validation Constants (FRD Compliance)
 */
export const STORAGE_LIMITS = {
  PHOTO_MAX_ORIGINAL_BYTES: 10 * 1024 * 1024, // 10 MB maximum upload size before compression
  PHOTO_MAX_FINAL_BYTES: 2 * 1024 * 1024,      // 2 MB maximum compressed target size
  DOC_MAX_BYTES: 10 * 1024 * 1024,             // 10 MB maximum PDF document size
  ALLOWED_PHOTO_MIME_TYPES: ['image/jpeg', 'image/jpg', 'image/png'] as const,
  ALLOWED_DOC_MIME_TYPES: ['application/pdf'] as const,
  SIGNED_URL_EXPIRY_SECONDS: 900,              // 15 minutes default signed URL expiration
};

export interface UploadOptions {
  centreId: string;
  entityType: string;   // 'CENTRE' | 'CONTACT' | 'DOCUMENT' | 'BUILDING' | 'FLOOR' | 'LAB' | 'POWER_NETWORK' | 'BANK'
  entityId: string;
  fieldKey: string;     // e.g. 'building_front_photo', 'lab_panoramic_photo', 'cancelled_cheque'
  fileName: string;
  mimeType: string;
  assetCategory?: AssetCategory;
  uploadedById?: string;
}

export interface UploadResult {
  storageProvider: StorageProvider;
  storageKey: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  originalSizeBytes: number;
  finalSizeBytes: number;
  isCompressed: boolean;
}

export interface IStorageProvider {
  uploadFile(
    fileBuffer: Buffer,
    options: UploadOptions
  ): Promise<UploadResult>;

  getSignedDownloadUrl(
    storageKey: string,
    expiresInSeconds?: number
  ): Promise<string>;

  deleteFile(storageKey: string): Promise<boolean>;
}

/**
 * Local File System Storage Provider
 * Fallback implementation storing files on the local filesystem.
 * Ready to swap with S3/GCS/R2 drivers via environment configuration.
 */
class LocalStorageProvider implements IStorageProvider {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'uploads');
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async uploadFile(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const ext = path.extname(options.fileName) || (options.mimeType === 'application/pdf' ? '.pdf' : '.jpg');
    const hash = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const safeBaseName = path.basename(options.fileName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const storageKey = `centres/${options.centreId}/${options.entityType.toLowerCase()}/${options.fieldKey}_${timestamp}_${hash}${ext}`;

    const targetPath = path.join(this.baseDir, storageKey);
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    await fs.promises.writeFile(targetPath, fileBuffer);

    const originalSizeBytes = fileBuffer.length;
    const finalSizeBytes = fileBuffer.length;

    // Public / API download endpoint route
    const fileUrl = `/api/v1/storage/${storageKey}`;

    return {
      storageProvider: 'local',
      storageKey,
      fileName: options.fileName,
      fileUrl,
      mimeType: options.mimeType,
      originalSizeBytes,
      finalSizeBytes,
      isCompressed: false,
    };
  }

  async getSignedDownloadUrl(storageKey: string, _expiresInSeconds = STORAGE_LIMITS.SIGNED_URL_EXPIRY_SECONDS): Promise<string> {
    // For local driver, returns direct secure API download route
    // Pluggable cloud drivers (S3/GCS/R2) return AWS S3 getSignedUrl or Google Storage getSignedUrl
    return `/api/v1/storage/${storageKey}`;
  }

  async deleteFile(storageKey: string): Promise<boolean> {
    try {
      const targetPath = path.join(this.baseDir, storageKey);
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
        return true;
      }
      return false;
    } catch (err) {
      console.error(`[LocalStorageProvider.deleteFile] Failed to remove ${storageKey}:`, err);
      return false;
    }
  }
}

/**
 * Cloud S3 Storage Driver Hook (Pluggable via AWS SDK)
 */
class S3StorageProvider implements IStorageProvider {
  async uploadFile(_fileBuffer: Buffer, _options: UploadOptions): Promise<UploadResult> {
    throw new Error('S3 Storage Driver not configured. Set STORAGE_PROVIDER=s3 and AWS credentials in environment.');
  }
  async getSignedDownloadUrl(_storageKey: string, _expiresInSeconds?: number): Promise<string> {
    throw new Error('S3 Storage Driver not configured.');
  }
  async deleteFile(_storageKey: string): Promise<boolean> {
    throw new Error('S3 Storage Driver not configured.');
  }
}

/**
 * Unified Storage Service
 * Exposes provider-agnostic file management with strict validation guards.
 */
export class StorageService {
  private static providerInstance: IStorageProvider;

  private static getProvider(): IStorageProvider {
    if (!this.providerInstance) {
      const configuredProvider = (process.env.STORAGE_PROVIDER || 'local').toLowerCase();
      switch (configuredProvider) {
        case 's3':
        case 'r2':
          this.providerInstance = new S3StorageProvider();
          break;
        case 'local':
        default:
          this.providerInstance = new LocalStorageProvider();
          break;
      }
    }
    return this.providerInstance;
  }

  /**
   * Validate uploaded photo attachments (JPEG, JPG, PNG up to 10MB)
   */
  static validatePhoto(
    fileBuffer: Buffer,
    mimeType: string
  ): { valid: boolean; error?: string } {
    if (!STORAGE_LIMITS.ALLOWED_PHOTO_MIME_TYPES.includes(mimeType as any)) {
      return {
        valid: false,
        error: `Invalid photo format (${mimeType}). Allowed formats: ${STORAGE_LIMITS.ALLOWED_PHOTO_MIME_TYPES.join(', ')}`,
      };
    }
    if (fileBuffer.length > STORAGE_LIMITS.PHOTO_MAX_ORIGINAL_BYTES) {
      return {
        valid: false,
        error: `Photo file size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit.`,
      };
    }
    return { valid: true };
  }

  /**
   * Validate uploaded compliance documents (PDF up to 10MB)
   */
  static validateDocument(
    fileBuffer: Buffer,
    mimeType: string
  ): { valid: boolean; error?: string } {
    if (!STORAGE_LIMITS.ALLOWED_DOC_MIME_TYPES.includes(mimeType as any)) {
      return {
        valid: false,
        error: `Invalid document format (${mimeType}). Only PDF documents (application/pdf) are permitted.`,
      };
    }
    if (fileBuffer.length > STORAGE_LIMITS.DOC_MAX_BYTES) {
      return {
        valid: false,
        error: `Document file size (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds 10 MB limit.`,
      };
    }
    return { valid: true };
  }

  /**
   * Universal upload handler for Photos and Documents
   */
  static async upload(fileBuffer: Buffer, options: UploadOptions): Promise<UploadResult> {
    const isDoc = options.assetCategory === 'DOCUMENT' || options.mimeType === 'application/pdf';
    const validation = isDoc
      ? this.validateDocument(fileBuffer, options.mimeType)
      : this.validatePhoto(fileBuffer, options.mimeType);

    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return this.getProvider().uploadFile(fileBuffer, options);
  }

  /**
   * Generates a time-limited signed URL for viewing or downloading the asset
   */
  static async getSignedUrl(storageKey: string, expiresInSeconds?: number): Promise<string> {
    return this.getProvider().getSignedDownloadUrl(storageKey, expiresInSeconds);
  }

  /**
   * Removes asset from underlying storage provider
   */
  static async delete(storageKey: string): Promise<boolean> {
    return this.getProvider().deleteFile(storageKey);
  }
}

export default StorageService;
