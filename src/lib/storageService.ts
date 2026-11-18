import { supabase } from './supabase';
import type { AuthUser } from '../types/studio';

export const POST_MEDIA_BUCKET = 'post-media';
export const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];

export interface MediaUploadResult {
  publicUrl: string;
  filePath: string;
  source: 'supabase-storage' | 'local-preview';
  warning?: string;
}

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Unsupported format. Please upload a PNG, JPG, WEBP, or GIF image.';
  }
  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return `File exceeds 5 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
  }
  return null;
}

function readFileAsCompressedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      if (!result) {
        reject(new Error('Empty image data.'));
        return;
      }

      if (file.type === 'image/gif' || result.length < 350_000) {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxDim = 1280;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadPostMedia(
  file: File,
  user: AuthUser,
  onProgress?: (percent: number) => void
): Promise<MediaUploadResult> {
  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }

  onProgress?.(20);

  const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const filePath = `${user.id}/${Date.now()}-${sanitizedName}`;

  if (supabase && user.provider === 'supabase') {
    try {
      onProgress?.(45);
      const { error: uploadError } = await supabase.storage
        .from(POST_MEDIA_BUCKET)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      onProgress?.(85);
      const { data } = supabase.storage
        .from(POST_MEDIA_BUCKET)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error('Could not resolve public URL from post-media bucket.');
      }

      onProgress?.(100);
      return {
        publicUrl: data.publicUrl,
        filePath,
        source: 'supabase-storage',
      };
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : (err as { message?: string })?.message || 'Bucket upload unavailable';
      const fallbackUrl = await readFileAsCompressedDataUrl(file);
      onProgress?.(100);
      return {
        publicUrl: fallbackUrl,
        filePath,
        source: 'local-preview',
        warning: `Using local media preview (${msg}). Ensure the "post-media" bucket exists in Supabase Storage.`,
      };
    }
  }

  onProgress?.(60);
  const localDataUrl = await readFileAsCompressedDataUrl(file);
  onProgress?.(100);

  return {
    publicUrl: localDataUrl,
    filePath,
    source: 'local-preview',
  };
}
