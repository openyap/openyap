import type { Doc } from "convex/_generated/dataModel";

export type ChatMessage = Doc<"message">;
export type StreamingMessage = Omit<
  ChatMessage,
  "_id" | "_creationTime" | "updatedAt"
>;

export type MessageReasoning = Doc<"message">["reasoning"];
export type MessageStatus = Doc<"message">["status"];
export type MessageUsage = Doc<"message">["usage"];