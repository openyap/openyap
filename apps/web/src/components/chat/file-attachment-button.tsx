import { Paperclip, Plus } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "~/components/ui/tooltip";
import { type AttachedFile, FILE_SERVICE_CONSTANTS } from "~/lib/file-utils";
import type { Model } from "~/lib/models";
import { supportsModality } from "~/lib/models";
import { cn } from "~/lib/utils";

interface FileAttachmentButtonProps {
  onFilesSelected: (files: File[]) => void;
  className?: string;
  disabled?: boolean;
  attachedFiles?: AttachedFile[];
  currentModel?: Model;
}

export function FileAttachmentButton({
  onFilesSelected,
  className,
  disabled = false,
  attachedFiles = [],
  currentModel,
}: FileAttachmentButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      onFilesSelected(files);
      // Reset input
      e.target.value = "";
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const hasAttachments = attachedFiles.length > 0;
  const supportsImages = currentModel
    ? supportsModality(currentModel, "image")
    : true;

  // Don't render if model doesn't support images
  if (!supportsImages) {
    return null;
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={FILE_SERVICE_CONSTANTS.ALLOWED_TYPES.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <Tooltip>
          <TooltipTrigger asChild>
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
          </TooltipTrigger>
          <TooltipContent>
            <p>Add photos or files</p>
          </TooltipContent>
        </Tooltip>
        <PopoverContent className="w-80 p-2" align="start" side="top">
          <div className="space-y-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={openFileDialog}
              disabled={disabled}
              className="flex w-full items-center justify-start gap-2"
            >
              <Paperclip className="h-4 w-4" />
              Upload a file
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
