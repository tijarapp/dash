import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import { extensionForImageFile, IMAGE_UPLOAD_MAX_BYTES, validateImageFile } from './imageUpload';
import { adminApp } from './firebaseAdmin';

function storageBucketName(): string {
  return (
    process.env.FIREBASE_STORAGE_BUCKET ||
    `${process.env.FIREBASE_PROJECT_ID}.appspot.com`
  );
}

export async function uploadCategoryImage(file: File): Promise<string> {
  if (!file.size) {
    throw new Error('لم يتم اختيار صورة');
  }

  const validationError = validateImageFile(file);
  if (validationError) {
    throw new Error(validationError);
  }
  if (file.size > IMAGE_UPLOAD_MAX_BYTES) {
    throw new Error('حجم الصورة يجب ألا يتجاوز 5 ميجابايت');
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = getStorage(adminApp).bucket(storageBucketName());
  const destination = `investment-categories/${Date.now()}-${randomUUID()}.${extensionForImageFile(file)}`;
  const bucketFile = bucket.file(destination);
  const downloadToken = randomUUID();

  await bucketFile.save(buffer, {
    metadata: {
      contentType: file.type,
      cacheControl: 'public, max-age=31536000',
      metadata: {
        firebaseStorageDownloadTokens: downloadToken,
      },
    },
  });

  const encodedPath = encodeURIComponent(destination);
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${downloadToken}`;
}
