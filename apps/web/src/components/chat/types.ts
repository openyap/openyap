import type { Doc } from "convex/_generated/dataModel";

export type ChatMessage = Doc<"message">;
export enum ChatStatus {
  IDLE = "idle",
  LOADING = "loading",
  STREAMING = "streaming",
}

export type MessageId = Doc<"message">["_id"];
export type MessageReasoning = Doc<"message">["reasoning"];
export type MessageStatus = Doc<"message">["status"];
export type MessageUsage = Doc<"message">["usage"];

export type AttachmentId = Doc<"attachment">["_id"];
