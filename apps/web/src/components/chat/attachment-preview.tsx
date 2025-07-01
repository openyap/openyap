import { Download, Eye, File, FileText, Image, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { cn } from "~/lib/utils";

export interface Attachment {
  id: string;
  type: string;
  url: string;
  name: string;
  size?: number;
  mimeType?: string;
}

interface AttachmentPreviewProps {
  attachment: Attachment;
  className?: string;
  showRemove?: boolean;
  onRemove?: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function getFileIcon(type: string, mimeType?: string) {
  if (type === "image" || mimeType?.startsWith("image/")) {
    return <Image className="h-4 w-4 text-blue-500" />;
  }
  if (type === "pdf" || mimeType === "application/pdf") {
    return <FileText className="h-4 w-4 text-red-500" />;
  }
  if (mimeType?.includes("document") || mimeType?.includes("word")) {
    return <FileText className="h-4 w-4 text-blue-500" />;
  }
  if (mimeType?.includes("sheet") || mimeType?.includes("excel")) {
    return <FileText className="h-4 w-4 text-green-500" />;
  }
  return <File className="h-4 w-4 text-gray-500" />;
}

function ImageThumbnail({ attachment }: { attachment: Attachment }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-gray-50">
        <Image className="h-4 w-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 overflow-hidden rounded border border-gray-200">
      <img
        src={attachment.url}
        alt={attachment.name}
        className="h-full w-full object-cover transition-transform duration-200 hover:scale-105"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

function LargeImagePreview({ attachment }: { attachment: Attachment }) {
  const [imageError, setImageError] = useState(false);

  if (imageError) {
    return (
      <div className="flex h-12 w-12 items-center justify-center rounded border border-gray-200 bg-gray-50">
        <Image className="h-4 w-4 text-gray-400" />
      </div>
    );
  }

  return (
    <div className="relative h-12 w-12 overflow-hidden rounded border border-gray-200">
      <img
        src={attachment.url}
        alt={attachment.name}
        className="h-full w-full object-cover"
        onError={() => setImageError(true)}
      />
    </div>
  );
}

function FileCard({ attachment }: { attachment: Attachment }) {
  const getFileTypeColor = (mimeType?: string) => {
    if (mimeType === "application/pdf") {
      return "bg-red-50 border-red-100 text-red-700";
    }
    if (mimeType?.includes("document") || mimeType?.includes("word")) {
      return "bg-blue-50 border-blue-100 text-blue-700";
    }
    if (mimeType?.includes("sheet") || mimeType?.includes("excel")) {
      return "bg-green-50 border-green-100 text-green-700";
    }
    return "bg-gray-50 border-gray-100 text-gray-700";
  };

  return (
    <div
      className={cn(
        "flex w-full max-w-sm items-center gap-3 rounded-lg border px-3 py-2.5 transition-all hover:shadow-sm",
        getFileTypeColor(attachment.mimeType),
      )}
    >
      <div className="flex-shrink-0">
        {getFileIcon(attachment.type, attachment.mimeType)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-sm">{attachment.name}</p>
        <div className="flex items-center gap-1.5 text-xs opacity-70">
          {attachment.size && <span>{formatFileSize(attachment.size)}</span>}
          {attachment.mimeType && attachment.size && <span>•</span>}
          {attachment.mimeType && (
            <span className="truncate">
              {attachment.mimeType.split("/")[1]?.toUpperCase() ||
                attachment.mimeType}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function FullImageViewer({ attachment }: { attachment: Attachment }) {
  return (
    <div className="flex max-h-[80vh] max-w-full items-center justify-center">
      <img
        src={attachment.url}
        alt={attachment.name}
        className="max-h-full max-w-full object-contain"
      />
    </div>
  );
}

export function AttachmentPreview({
  attachment,
  className,
  showRemove = false,
  onRemove,
}: AttachmentPreviewProps) {
  const isImage =
    attachment.type === "image" || attachment.mimeType?.startsWith("image/");
  const isPdf =
    attachment.type === "pdf" || attachment.mimeType === "application/pdf";

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    const link = document.createElement("a");
    link.href = attachment.url;
    link.download = attachment.name;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(attachment.url, "_blank");
  };

  if (!isImage) {
    return (
      <div className={cn("group relative", className)}>
        <FileCard attachment={attachment} />

        <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {isPdf && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleView}
              className="h-6 w-6 bg-white/90 p-0 hover:bg-white"
            >
              <Eye className="h-3 w-3" />
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={handleDownload}
            className="h-6 w-6 bg-white/90 p-0 hover:bg-white"
          >
            <Download className="h-3 w-3" />
          </Button>

          {showRemove && onRemove && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="h-6 w-6 bg-white/90 p-0 text-red-500 hover:bg-red-50"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // For images, check if it should be shown as thumbnail or large preview
  // Large preview for images that are the main content, thumbnail for referenced images
  const shouldShowLargePreview = !showRemove; // Assuming showRemove means it's in input, not in message

  if (shouldShowLargePreview) {
    return (
      <div className={cn("group relative", className)}>
        <Dialog>
          <DialogTrigger asChild>
            <div className="cursor-pointer">
              <LargeImagePreview attachment={attachment} />
            </div>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-left">{attachment.name}</DialogTitle>
              <DialogDescription className="text-left">
                {attachment.size && formatFileSize(attachment.size)}
                {attachment.mimeType && attachment.size && " • "}
                {attachment.mimeType}
              </DialogDescription>
            </DialogHeader>
            <FullImageViewer attachment={attachment} />
          </DialogContent>
        </Dialog>

        {showRemove && onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }}
            className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
          >
            <X className="h-2.5 w-2.5" />
          </button>
        )}
      </div>
    );
  }

  // Thumbnail version for image references or in input
  return (
    <div className={cn("group relative", className)}>
      <Dialog>
        <DialogTrigger asChild>
          <div className="cursor-pointer">
            <ImageThumbnail attachment={attachment} />
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-left">{attachment.name}</DialogTitle>
            <DialogDescription className="text-left">
              {attachment.size && formatFileSize(attachment.size)}
              {attachment.mimeType && attachment.size && " • "}
              {attachment.mimeType}
            </DialogDescription>
          </DialogHeader>
          <FullImageViewer attachment={attachment} />
        </DialogContent>
      </Dialog>

      {showRemove && onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="-top-1 -right-1 absolute flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
        >
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </div>
  );
}

export function AttachmentList({
  attachments,
  className,
  showRemove = false,
  onRemoveAttachment,
}: {
  attachments: Attachment[];
  className?: string;
  showRemove?: boolean;
  onRemoveAttachment?: (attachmentId: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }

  const images = attachments.filter(
    (att) => att.type === "image" || att.mimeType?.startsWith("image/"),
  );
  const documents = attachments.filter(
    (att) => att.type !== "image" && !att.mimeType?.startsWith("image/"),
  );

  return (
    <div className={cn("space-y-3", className)}>
      {/* Images */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {images.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              showRemove={showRemove}
              onRemove={() => onRemoveAttachment?.(attachment.id)}
            />
          ))}
        </div>
      )}

      {/* Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          {documents.map((attachment) => (
            <AttachmentPreview
              key={attachment.id}
              attachment={attachment}
              showRemove={showRemove}
              onRemove={() => onRemoveAttachment?.(attachment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
