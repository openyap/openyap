import { FILE_CONSTANTS, STORAGE_KEYS } from "~/lib/constants";

export interface SerializedFile {
  name: string;
  size: number;
  type: string;
  lastModified: number;
  data: string; // base64 encoded
}

export interface AttachedFile {
  file: File;
  progress?: number;
  error?: string;
  attachmentId?: string;
}

export const STORAGE_KEY = STORAGE_KEYS.PENDING_ATTACHMENTS;
export const MAX_FILE_SIZE = FILE_CONSTANTS.MAX_FILE_SIZE;
export const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json",
  "text/csv",
] as const;

/**
 * Validates if a file is acceptable for upload
 */
export const validateFile = (
  file: File,
): { valid: boolean; error?: string } => {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds limit of ${FILE_CONSTANTS.MAX_FILE_SIZE / 1024 / 1024}MB`,
    };
  }

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return {
      valid: false,
      error: `File type ${file.type} is not supported`,
    };
  }

  return { valid: true };
};

/**
 * Converts a File to base64 string
 */
export const fileToBase64 = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        // Remove data URL prefix (e.g., "data:image/png;base64,")
        const base64 = reader.result.split(",")[1];
        resolve(base64);
      } else {
        reject(new Error("Failed to convert file to base64"));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

/**
 * Converts a File to SerializedFile
 */
export const serializeFile = async (file: File): Promise<SerializedFile> => {
  const data = await fileToBase64(file);
  return {
    name: file.name,
    size: file.size,
    type: file.type,
    lastModified: file.lastModified,
    data,
  };
};

/**
 * Converts multiple Files to SerializedFiles
 */
export const serializeFiles = async (
  files: File[],
): Promise<SerializedFile[]> => {
  return Promise.all(files.map((file) => serializeFile(file)));
};

/**
 * Saves files to session storage
 */
export const saveFilesToStorage = async (files: File[]): Promise<void> => {
  try {
    const serializedFiles = await serializeFiles(files);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(serializedFiles));
  } catch (error) {
    console.error("Failed to save files to storage:", error);
    throw new Error("Failed to save files");
  }
};

/**
 * Loads files from session storage
 */
export const loadFilesFromStorage = (): SerializedFile[] => {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error("Failed to load files from storage:", error);
    return [];
  }
};

/**
 * Clears files from session storage
 */
export const clearStoredFiles = (): void => {
  sessionStorage.removeItem(STORAGE_KEY);
};

/**
 * Updates stored files by removing one at index
 */
export const updateStoredFiles = async (
  currentFiles: File[],
  removeIndex: number,
): Promise<void> => {
  const updatedFiles = currentFiles.filter((_, i) => i !== removeIndex);
  if (updatedFiles.length > 0) {
    await saveFilesToStorage(updatedFiles);
  } else {
    clearStoredFiles();
  }
};

/**
 * Creates a blob URL for file preview
 */
export const createFileUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

/**
 * Revokes a blob URL to free memory
 */
export const revokeFileUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

/**
 * Gets file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split(".").pop()?.toLowerCase() || "";
};

/**
 * Determines if file is an image based on MIME type
 */
export const isImageFile = (file: File): boolean => {
  return file.type.startsWith("image/");
};

/**
 * Formats file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
};

/**
 * Batch validation of multiple files
 */
export const validateFiles = (
  files: File[],
): {
  valid: File[];
  invalid: Array<{ file: File; error: string }>;
} => {
  const valid: File[] = [];
  const invalid: Array<{ file: File; error: string }> = [];

  for (const file of files) {
    const validation = validateFile(file);
    if (validation.valid) {
      valid.push(file);
    } else {
      invalid.push({ file, error: validation.error || "Invalid file" });
    }
  }

  return { valid, invalid };
};

// Export constants for use in components
export const FILE_SERVICE_CONSTANTS = {
  MAX_FILE_SIZE,
  ALLOWED_TYPES,
  STORAGE_KEY,
} as const;
