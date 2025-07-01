import { File, FileText, Image, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "~/lib/utils";

interface FilePill {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

interface FilePillsProps {
  files: FilePill[];
  onRemove: (fileId: string) => void;
  className?: string;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-3.5 w-3.5 text-blue-500" />;
  }
  if (mimeType === "application/pdf") {
    return <FileText className="h-3.5 w-3.5 text-red-500" />;
  }
  if (mimeType.includes("document") || mimeType.includes("word")) {
    return <FileText className="h-3.5 w-3.5 text-blue-500" />;
  }
  if (mimeType.includes("sheet") || mimeType.includes("excel")) {
    return <FileText className="h-3.5 w-3.5 text-green-500" />;
  }
  return <File className="h-3.5 w-3.5 text-gray-500" />;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`;
}

function ImageThumbnail({
  file,
  onRemove,
}: { file: FilePill; onRemove: () => void }) {
  if (!file.url) {
    return (
      <motion.div
        className="group relative"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        layout
      >
        <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded border border-gray-200 bg-gray-50 transition-all hover:border-red-300 hover:bg-red-50">
          <Image className="h-4 w-4 text-gray-400 transition-colors group-hover:text-red-400" />
        </div>
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
      </motion.div>
    );
  }

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      layout
    >
      <div className="relative h-12 w-12 cursor-pointer overflow-hidden rounded border border-gray-200 transition-all hover:border-red-300 hover:shadow-sm">
        <img
          src={file.url}
          alt={file.name}
          className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = "none";
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML =
                '<div class="flex h-full w-full items-center justify-center bg-gray-50"><svg class="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m4 16 4.586-4.586a2 2 0 0 1 2.828 0L16 16m-2-2 1.586-1.586a2 2 0 0 1 2.828 0L20 14m-6-6h.01M6 20h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z"></path></svg></div>';
            }
          }}
        />
      </div>
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
    </motion.div>
  );
}

function FileCard({
  file,
  onRemove,
}: { file: FilePill; onRemove: () => void }) {
  const getDocumentBackground = (mimeType: string) => {
    if (mimeType === "application/pdf") {
      return "bg-red-50 border-red-200";
    }
    if (mimeType.includes("document") || mimeType.includes("word")) {
      return "bg-blue-50 border-blue-200";
    }
    if (mimeType.includes("sheet") || mimeType.includes("excel")) {
      return "bg-green-50 border-green-200";
    }
    return "bg-gray-50 border-gray-200";
  };

  return (
    <motion.div
      className="group relative"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      layout
    >
      <div
        className={cn(
          "flex h-12 w-12 cursor-pointer items-center justify-center rounded border transition-all hover:border-red-300 hover:shadow-sm",
          getDocumentBackground(file.type),
        )}
        title={`${file.name} (${formatFileSize(file.size)})`}
      >
        {getFileIcon(file.type)}
      </div>
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
    </motion.div>
  );
}

export function FilePills({ files, onRemove, className }: FilePillsProps) {
  return (
    <AnimatePresence mode="popLayout">
      {files.length > 0 && (
        <motion.div
          className={cn("origin-top space-y-2", className)}
          initial={{ opacity: 0, height: 0 }}
          animate={{
            opacity: 1,
            height: "auto",
          }}
          exit={{
            opacity: 0,
            height: 0,
          }}
          transition={{
            duration: 0.25,
            ease: [0.32, 0.72, 0, 1],
          }}
        >
          {/* All files as thumbnails */}
          <motion.div className="flex flex-wrap gap-2" layout>
            <AnimatePresence mode="popLayout">
              {files.map((file) =>
                file.type.startsWith("image/") ? (
                  <ImageThumbnail
                    key={file.id}
                    file={file}
                    onRemove={() => onRemove(file.id)}
                  />
                ) : (
                  <FileCard
                    key={file.id}
                    file={file}
                    onRemove={() => onRemove(file.id)}
                  />
                ),
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
