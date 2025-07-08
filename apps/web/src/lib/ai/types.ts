// Proper type definitions for AI streaming and tool calls

export interface ToolCallArgs {
  [key: string]: unknown;
}

export interface ToolCall<TName extends string = string, TArgs = ToolCallArgs> {
  toolCallId: string;
  toolName: TName;
  args: TArgs;
}

export interface ToolResult<TName extends string = string, TResult = unknown> {
  toolCallId: string;
  toolName: TName;
  result: TResult;
}

export interface StreamedToolCall {
  toolCallId: string;
  toolName: string;
  args: string; // JSON string that needs parsing
}

export interface StreamedToolResult {
  toolCallId: string;
  toolName: string;
  result: unknown;
}

// Reasoning types
export interface ReasoningContent {
  id: string;
  type: "thinking" | "reasoning";
  content: string;
}

export interface ReasoningDelta {
  id: string;
  type: "thinking" | "reasoning";
  textDelta: string;
}

// Usage types
export interface UsageMetadata {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

// File attachment types
export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
}

// Type guards
export function isToolCall(value: unknown): value is ToolCall {
  return (
    value != null &&
    typeof value === "object" &&
    "toolCallId" in value &&
    typeof value.toolCallId === "string" &&
    "toolName" in value &&
    typeof value.toolName === "string" &&
    "args" in value &&
    typeof value.args === "object"
  );
}

export function isToolResult(value: unknown): value is ToolResult {
  return (
    value != null &&
    typeof value === "object" &&
    "toolCallId" in value &&
    typeof value.toolCallId === "string" &&
    "toolName" in value &&
    typeof value.toolName === "string" &&
    "result" in value
  );
}

export function isReasoningContent(value: unknown): value is ReasoningContent {
  return (
    value != null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "type" in value &&
    (value.type === "thinking" || value.type === "reasoning") &&
    "content" in value &&
    typeof value.content === "string"
  );
}

export function isReasoningDelta(value: unknown): value is ReasoningDelta {
  return (
    value != null &&
    typeof value === "object" &&
    "id" in value &&
    typeof value.id === "string" &&
    "type" in value &&
    (value.type === "thinking" || value.type === "reasoning") &&
    "textDelta" in value &&
    typeof value.textDelta === "string"
  );
}
