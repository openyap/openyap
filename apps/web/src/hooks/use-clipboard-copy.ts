import { useState } from "react";

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

export function useClipboardCopy() {
  const [isCopied, setIsCopied] = useState(false);

  async function copy(text: string) {
    setIsCopied(await copyToClipboard(text));
    setTimeout(() => setIsCopied(false), 3000);
  };

  return { isCopied, copy };
}