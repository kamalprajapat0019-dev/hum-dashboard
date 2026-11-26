/**
 * Client-Side Upload Validation & Photo Compression Utilities
 * Adheres strictly to FRD Sec. 11, 22-25:
 * - Photos: JPG/JPEG only, <= 10MB original, auto-compressed to <= 2MB
 * - Documents: PDF only, <= 10MB
 */

export const UPLOAD_LIMITS = {
  PHOTO_MAX_ORIGINAL_BYTES: 10 * 1024 * 1024, // 10 MB original limit
  PHOTO_MAX_FINAL_BYTES: 2 * 1024 * 1024,      // 2 MB target compressed limit
  DOC_MAX_BYTES: 10 * 1024 * 1024,             // 10 MB document limit
  ALLOWED_PHOTO_EXTENSIONS: ['.jpg', '.jpeg'],
  ALLOWED_PHOTO_MIMES: ['image/jpeg', 'image/jpg'],
  ALLOWED_DOC_MIMES: ['application/pdf'],
};

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Validates and compresses a photo on the client using HTML5 Canvas
 */
export async function validateAndCompressPhoto(file) {
  if (!file) {
    return { success: false, error: 'No file selected.' };
  }

  // 1. Format Check: JPG / JPEG only
  const isJpegMime = UPLOAD_LIMITS.ALLOWED_PHOTO_MIMES.includes(file.type.toLowerCase());
  const isJpegExt = /\.(jpe?g)$/i.test(file.name);
  if (!isJpegMime && !isJpegExt) {
    return {
      success: false,
      error: 'Invalid photo format. Only JPG and JPEG photos are accepted.',
    };
  }

  // 2. Original Size Check: <= 10MB
  if (file.size > UPLOAD_LIMITS.PHOTO_MAX_ORIGINAL_BYTES) {
    return {
      success: false,
      error: `Photo original size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 10 MB.`,
    };
  }

  // 3. Compression via Canvas
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read photo file.' });
    };

    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => {
        resolve({ success: false, error: 'Failed to process image data.' });
      };

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxDimension = 1920;

          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Progressive compression
          let quality = 0.85;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);

          // Estimate byte size from Base64 length
          const getEstimatedBytes = (base64) => {
            const head = 'data:image/jpeg;base64,';
            return Math.round(((base64.length - head.length) * 3) / 4);
          };

          let finalBytes = getEstimatedBytes(dataUrl);

          if (finalBytes > UPLOAD_LIMITS.PHOTO_MAX_FINAL_BYTES) {
            quality = 0.7;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            finalBytes = getEstimatedBytes(dataUrl);
          }

          if (finalBytes > UPLOAD_LIMITS.PHOTO_MAX_FINAL_BYTES) {
            quality = 0.55;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            finalBytes = getEstimatedBytes(dataUrl);
          }

          if (finalBytes > UPLOAD_LIMITS.PHOTO_MAX_FINAL_BYTES) {
            resolve({
              success: false,
              error: `Photo size (${formatBytes(finalBytes)}) exceeds 2 MB even after compression. Please upload a smaller photo.`,
            });
            return;
          }

          resolve({
            success: true,
            fileName: file.name,
            fileUrl: dataUrl,
            mimeType: 'image/jpeg',
            originalSizeBytes: file.size,
            finalSizeBytes: finalBytes,
            isCompressed: true,
          });
        } catch (err) {
          resolve({
            success: false,
            error: err?.message || 'Failed to compress photo.',
          });
        }
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Validates a compliance document (PDF only, <= 10MB)
 */
export async function validateDocumentFile(file) {
  if (!file) {
    return { success: false, error: 'No file selected.' };
  }

  // 1. Format Check: PDF only
  const isPdfMime = file.type === 'application/pdf';
  const isPdfExt = /\.pdf$/i.test(file.name);
  if (!isPdfMime && !isPdfExt) {
    return {
      success: false,
      error: 'Invalid document format. Only PDF documents (application/pdf) are permitted.',
    };
  }

  // 2. Size Check: <= 10MB
  if (file.size > UPLOAD_LIMITS.DOC_MAX_BYTES) {
    return {
      success: false,
      error: `Document file size (${formatBytes(file.size)}) exceeds the maximum allowed limit of 10 MB.`,
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read document file.' });
    };

    reader.onload = (e) => {
      resolve({
        success: true,
        fileName: file.name,
        fileUrl: e.target.result,
        mimeType: 'application/pdf',
        originalSizeBytes: file.size,
        finalSizeBytes: file.size,
        isCompressed: false,
      });
    };

    reader.readAsDataURL(file);
  });
}
