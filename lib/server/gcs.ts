import { Storage, StorageOptions, UploadOptions } from "@google-cloud/storage";
import { randomBytes } from "node:crypto";

type ServiceAccountCredentials = {
  project_id?: string;
  [key: string]: unknown;
};

let storageInstance: Storage | null = null;
let decodedCredentials: ServiceAccountCredentials | null = null;
let credentialsInitialized = false;

const bucketName = process.env.GCS_BUCKET_NAME;

function decodeServiceAccount(): ServiceAccountCredentials | null {
  if (credentialsInitialized) {
    return decodedCredentials;
  }

  const base64 = process.env.GCS_SERVICE_ACCOUNT_BASE64;
  const inlineJson = process.env.GCS_SERVICE_ACCOUNT_JSON;

  if (base64) {
    const json = Buffer.from(base64, "base64").toString("utf-8");
    decodedCredentials = JSON.parse(json);
    credentialsInitialized = true;
    return decodedCredentials;
  }

  if (inlineJson) {
    decodedCredentials = JSON.parse(inlineJson);
    credentialsInitialized = true;
    return decodedCredentials;
  }

  decodedCredentials = null;
  credentialsInitialized = true;
  return decodedCredentials;
}

export function getStorageClient(): Storage {
  if (storageInstance) return storageInstance;

  const options: StorageOptions = {};
  const credentials = decodeServiceAccount();

  if (credentials) {
    options.credentials = credentials;
    if (!options.projectId && typeof credentials.project_id === "string") {
      options.projectId = credentials.project_id;
    }
  }

  storageInstance = new Storage(options);
  return storageInstance;
}

export function getBucket() {
  if (!bucketName) {
    throw new Error("Missing GCS_BUCKET_NAME env variable");
  }

  return getStorageClient().bucket(bucketName);
}

export function buildObjectName(fileName: string, prefix?: string) {
  const normalizedPrefix = prefix ? prefix.replace(/\/+$/g, "") : (process.env.GCS_UPLOAD_PREFIX || "").replace(/\/+$/g, "");
  const baseName = fileName
    .toLowerCase()
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
  const uniqueSuffix = cryptoRandom(16);
  const cleanName = baseName || "file";
  return normalizedPrefix ? `${normalizedPrefix}/${uniqueSuffix}-${cleanName}` : `${uniqueSuffix}-${cleanName}`;
}

export function getPublicUrl(objectName: string) {
  if (!bucketName) {
    throw new Error("Missing GCS_BUCKET_NAME env variable");
  }
  return `https://storage.googleapis.com/${bucketName}/${objectName}`;
}

export async function uploadBufferToGcs(
  buffer: Buffer,
  objectName: string,
  contentType?: string,
  uploadOptions: UploadOptions = {},
) {
  const bucket = getBucket();
  const file = bucket.file(objectName);
  const metadata = {
    cacheControl: "public, max-age=31536000, immutable",
    ...(uploadOptions.metadata ?? {}),
    ...(contentType ? { contentType } : {}),
  };
  const options: UploadOptions = {
    resumable: false,
    ...uploadOptions,
    metadata,
  };

  await file.save(buffer, options);
  return file;
}

function cryptoRandom(byteLength: number) {
  return randomBytes(byteLength).toString("hex");
}
