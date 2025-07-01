import { Plus, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import type { AttachedFile } from "~/components/chat/stores";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

interface FileAttachmentButtonProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
  attachedFiles?: AttachedFile[];
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

export function FileAttachmentButton({
  onFilesSelected,
  className,
  disabled = false,
  attachedFiles = [],
}: FileAttachmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      // Reset input
      e.target.value = "";
    }
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
    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      onFilesSelected(files);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const hasAttachments = attachedFiles.length > 0;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ALLOWED_FILE_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "relative h-8 w-8 p-0 text-muted-foreground hover:text-foreground",
              hasAttachments && "text-primary hover:text-primary",
              className,
            )}
            disabled={disabled}
          >
            <motion.div
              animate={{ rotate: isOpen ? 45 : 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <Plus className="h-4 w-4" />
            </motion.div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Attach Files</h4>
              {hasAttachments && (
                <span className="text-muted-foreground text-xs">
                  {attachedFiles.length} file
                  {attachedFiles.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "cursor-pointer rounded-md border-2 border-dashed p-4 text-center transition-colors",
                isDragOver
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25",
                disabled && "cursor-not-allowed opacity-50",
              )}
              onClick={!disabled ? openFileDialog : undefined}
              onKeyDown={(e) => {
                if (!disabled && e.key === "Enter") {
                  e.preventDefault();
                  openFileDialog();
                }
              }}
              tabIndex={disabled ? -1 : 0}
            >
              <Upload className="mx-auto mb-2 h-5 w-5 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">
                Drop files here or click to select
              </p>
              <p className="mt-1 text-muted-foreground/70 text-xs">
                Images, PDFs, documents
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
