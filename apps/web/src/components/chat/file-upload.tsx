import { useMutation } from "convex/react";
import { File, FileText, Image, Loader2, Upload, X } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import type { MessageId } from "~/components/chat/types";
import { Button } from "~/components/ui/button";
import { api } from "~/lib/db/server";
import { cn } from "~/lib/utils";

interface FileUploadProps {
  onFilesUploaded: (attachmentIds: string[]) => void;
  className?: string;
  maxFiles?: number;
  disabled?: boolean;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
  attachmentId?: string;
}

const ALLOWED_FILE_TYPES = [
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
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 25 * 1024 * 1024; // 25MB

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-4 w-4" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-4 w-4" />;
  }
  return <File className="h-4 w-4" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export function FileUpload({
  onFilesUploaded,
  className,
  maxFiles = 10,
  disabled = false,
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(
    api.functions.attachment.generateUploadUrl,
  );

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return `File type ${file.type} is not allowed`;
    }

    const maxSize = file.type.startsWith("image/")
      ? MAX_IMAGE_SIZE
      : MAX_FILE_SIZE;
    if (file.size > maxSize) {
      return `File too large. Maximum size is ${formatFileSize(maxSize)}`;
    }

    return null;
  }, []);

  const uploadFile = useCallback(
    async (file: File, messageId: string): Promise<string | null> => {
      try {
        // Generate upload URL
        const uploadUrl = await generateUploadUrl({
          sessionToken: localStorage.getItem("sessionToken") || "",
        });

        // Upload file to storage
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!result.ok) {
          throw new Error("Upload failed");
        }

        const { storageId } = await result.json();

        // Create attachment record
        const createAttachment = useMutation(
          api.functions.attachment.createAttachment,
        );
        const attachmentId = await createAttachment({
          storageId,
          messageId: messageId as MessageId,
          name: file.name,
          size: file.size,
          mimeType: file.type,
          sessionToken: localStorage.getItem("sessionToken") || "",
        });

        return attachmentId;
      } catch (error) {
        console.error("Upload error:", error);
        return null;
      }
    },
    [generateUploadUrl],
  );

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      if (disabled) return;

      const fileArray = Array.from(files);
      const validFiles: File[] = [];
      const errors: string[] = [];

      // Validate all files first
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          errors.push(`${file.name}: ${error}`);
        } else {
          validFiles.push(file);
        }
      }

      // Check total file count
      if (uploadingFiles.length + validFiles.length > maxFiles) {
        errors.push(`Maximum ${maxFiles} files allowed`);
        validFiles.splice(maxFiles - uploadingFiles.length);
      }

      // Show errors
      if (errors.length > 0) {
        console.error(`Upload errors:\n${errors.join("\n")}`);
      }

      if (validFiles.length === 0) return;

      // Add files to uploading state
      const newUploadingFiles: UploadingFile[] = validFiles.map((file) => ({
        file,
        progress: 0,
      }));

      setUploadingFiles((prev) => [...prev, ...newUploadingFiles]);

      // TODO: This would normally be called when creating a message
      // For now, we'll use a placeholder messageId
      const messageId = "placeholder-message-id";

      // Upload files
      const uploadPromises = validFiles.map(async (file, _index) => {
        try {
          setUploadingFiles((prev) =>
            prev.map((f, _i) => (f.file === file ? { ...f, progress: 10 } : f)),
          );

          const attachmentId = await uploadFile(file, messageId);

          if (attachmentId) {
            setUploadingFiles((prev) =>
              prev.map((f) =>
                f.file === file ? { ...f, progress: 100, attachmentId } : f,
              ),
            );
          } else {
            throw new Error("Failed to create attachment");
          }

          return attachmentId;
        } catch (error) {
          setUploadingFiles((prev) =>
            prev.map((f) =>
              f.file === file
                ? {
                    ...f,
                    error:
                      error instanceof Error ? error.message : "Upload failed",
                  }
                : f,
            ),
          );
          return null;
        }
      });

      const results = await Promise.all(uploadPromises);
      const successfulUploads = results.filter(
        (id): id is string => id !== null,
      );

      if (successfulUploads.length > 0) {
        onFilesUploaded(successfulUploads);
      }
    },
    [
      disabled,
      uploadingFiles.length,
      maxFiles,
      onFilesUploaded,
      validateFile,
      uploadFile,
    ],
  );

  const removeFile = (index: number) => {
    setUploadingFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_FILE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onKeyDown={(e) => {
          if (!disabled && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            openFileDialog();
          }
        }}
        tabIndex={disabled ? -1 : 0}
        className={cn(
          "cursor-pointer rounded-lg border-2 border-dashed p-4 text-center transition-colors",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25",
          disabled && "cursor-not-allowed opacity-50",
        )}
        onClick={!disabled ? openFileDialog : undefined}
      >
        <Upload className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
        <p className="text-muted-foreground text-sm">
          Drop files here or click to select
        </p>
        <p className="mt-1 text-muted-foreground text-xs">
          Images, PDFs, and documents up to {formatFileSize(MAX_FILE_SIZE)}
        </p>
      </div>

      {/* Uploading Files List */}
      {uploadingFiles.length > 0 && (
        <div className="max-h-40 space-y-2 overflow-y-auto">
          {uploadingFiles.map((uploadingFile, index) => (
            <div
              key={`${uploadingFile.file.name}-${uploadingFile.file.size}-${uploadingFile.file.lastModified}`}
              className="flex items-center gap-2 rounded-md bg-muted/50 p-2"
            >
              {getFileIcon(uploadingFile.file.type)}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-sm">
                  {uploadingFile.file.name}
                </p>
                <p className="text-muted-foreground text-xs">
                  {formatFileSize(uploadingFile.file.size)}
                </p>
                {uploadingFile.error && (
                  <p className="text-destructive text-xs">
                    {uploadingFile.error}
                  </p>
                )}
              </div>

              {uploadingFile.progress > 0 && uploadingFile.progress < 100 && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}

              {uploadingFile.progress === 100 && !uploadingFile.error && (
                <div className="text-green-600 text-xs">✓</div>
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
