import { type ClassValue, clsx } from "clsx";
import type { Token } from "marked";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generate a stable key for a token based on its properties.
 * This is used for React keys when rendering arrays of tokens.
 *
 * The key combines:
 * - Token type (e.g., "text", "link", "code")
 * - A hash of the raw content
 * - The index as a fallback for uniqueness
 */
export function getTokenKey(token: Token, index: number): string {
  const type = token.type;
  const raw = token.raw || "";

  // Simple hash function for the raw content
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Combine type, hash, and index for a stable but unique key
  return `${type}-${hash}-${index}`;
}
