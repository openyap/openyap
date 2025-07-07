import { useCallback, useEffect, useRef, useState } from "react";

interface UseFileDropOptions {
  onDrop?: (files: File[]) => void;
  disabled?: boolean;
}

export function useFileDrop({
  onDrop,
  disabled = false,
}: UseFileDropOptions = {}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragOverTarget, setIsDragOverTarget] = useState(false);
  const dragCounter = useRef(0);

  // Global drag detection
  useEffect(() => {
    if (disabled) return;

    const handleGlobalDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current++;
      if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
        setIsDragOver(true);
      }
    };

    const handleGlobalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current--;
      if (dragCounter.current === 0) {
        setIsDragOver(false);
      }
    };

    const handleGlobalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleGlobalDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setIsDragOver(false);
      setIsDragOverTarget(false);
    };

    document.addEventListener("dragenter", handleGlobalDragEnter);
    document.addEventListener("dragleave", handleGlobalDragLeave);
    document.addEventListener("dragover", handleGlobalDragOver);
    document.addEventListener("drop", handleGlobalDrop);

    return () => {
      document.removeEventListener("dragenter", handleGlobalDragEnter);
      document.removeEventListener("dragleave", handleGlobalDragLeave);
      document.removeEventListener("dragover", handleGlobalDragOver);
      document.removeEventListener("drop", handleGlobalDrop);
    };
  }, [disabled]);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverTarget(false);

      if (
        !disabled &&
        e.dataTransfer.files &&
        e.dataTransfer.files.length > 0
      ) {
        const files = Array.from(e.dataTransfer.files);
        onDrop?.(files);
      }
    },
    [onDrop, disabled],
  );

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverTarget(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (disabled) return;
      e.preventDefault();
      e.stopPropagation();

      // Check if we're actually leaving the target area
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX;
      const y = e.clientY;

      if (
        x < rect.left ||
        x >= rect.right ||
        y < rect.top ||
        y >= rect.bottom
      ) {
        setIsDragOverTarget(false);
      }
    },
    [disabled],
  );

  return {
    isDragOver,
    isDragOverTarget,
    dropProps: {
      onDrop: handleDrop,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
    },
  };
}
