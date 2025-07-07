import { useState } from "react";
import { logger } from "~/lib/logger";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    logger.error(`Clipboard write operation failed: ${String(error)}`);
    return false;
  }
}

export function useClipboardCopy() {
  const [isCopied, setIsCopied] = useState(false);

  async function copy(text: string) {
    setIsCopied(await copyToClipboard(text));
    setTimeout(() => setIsCopied(false), 3000);
  }

  return { isCopied, copy };
}
