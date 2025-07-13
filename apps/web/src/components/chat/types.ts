import type { Doc } from "convex/_generated/dataModel";

export type ChatMessage = Doc<"message">;
export enum ChatStatus {
  IDLE = "idle",
  STREAMING = "streaming",
}

export enum MessageStatus {
  COMPLETED = "completed",
  GENERATING = "generating",
  REASONING = "reasoning",
  FINISHED = "finished",
  ABORTED = "aborted",
  FAILED = "failed",
  STREAMING = "streaming",
}

export type MessageId = Doc<"message">["_id"];
export type MessageReasoning = Doc<"message">["reasoning"];
export type MessageStatusType = Doc<"message">["status"];
export type MessageUsage = Doc<"message">["usage"];

export type AttachmentId = Doc<"attachment">["_id"];
