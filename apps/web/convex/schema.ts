import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Chat sessions/conversations
  chat: defineTable({
    // Title of the chat
    title: v.optional(v.string()),
    // User who created/owns the chat
    ownerId: v.id("user"),
    // Whether the chat is shared/public
    isShared: v.boolean(),
    // Token for sharing the chat
    shareToken: v.optional(v.string()),
    // Default LLM provider for the chat
    provider: v.optional(v.string()),
    // Chat-specific settings (model, temperature, etc.)
    settings: v.optional(v.object({})),
    // Last update timestamp
    updatedAt: v.string(),
  }),

  // Many-to-many relationship: users in a chat
  chatMembers: defineTable({
    // Chat this membership belongs to
    chatId: v.id("chat"),
    // User in the chat
    userId: v.id("user"),
    // Role in the chat (owner, member, admin, etc.)
    role: v.optional(v.string()),
    // Who invited this user
    invitedBy: v.optional(v.id("user")),
    // When the user was pinned (if applicable)
    pinnedAt: v.optional(v.string()),
    // When the user joined the chat
    joinedAt: v.string(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_userId", ["userId"]),

  // Messages in a chat (threaded, branchable)
  message: defineTable({
    // Chat this message belongs to
    chatId: v.id("chat"),
    // Parent message for threads/replies
    parentId: v.optional(v.id("message")),
    // Root message for branches/alternative paths
    branchRootId: v.optional(v.id("message")),
    // Author of the message (user or null for AI/system)
    userId: v.optional(v.id("user")),
    // Role: "user", "assistant", "system", etc.
    role: v.string(),
    // LLM provider for this message (if AI)
    provider: v.optional(v.string()),
    // Model name/version (if AI)
    model: v.optional(v.string()),
    // Plain text fallback or summary (search messages)
    content: v.string(),
    // Message status ("complete", "streaming", "error", etc.)
    status: v.optional(v.string()),
    // LLM token usage (if AI)
    tokensUsed: v.optional(v.number()),
    // Web search/RAG results (if any)
    webSearchResults: v.optional(v.any()),
    // Array of attachment IDs (message-level attachments)
    attachments: v.optional(v.array(v.id("attachment"))),
    // True if message is being streamed/generated
    streaming: v.boolean(),
    // Vector embedding for semantic search (e.g., 1536-dim OpenAI embedding) TODO: add vector index
    embedding: v.optional(v.array(v.number())),
    // Last update timestamp
    updatedAt: v.string(),
  })
    .index("by_chatId", ["chatId"])
    .index("by_parentId", ["parentId"])
    .index("by_branchRootId", ["branchRootId"]),

  // Notion-style blocks (all content is in blocks)
  block: defineTable({
    // Message this block belongs to
    messageId: v.id("message"),
    // Parent block for nesting (null for root blocks)
    parentBlockId: v.optional(v.id("block")),
    // Block type ("paragraph", "heading", "code", etc.)
    type: v.string(),
    // Block content (rich text, code, image URL, etc.)
    content: v.any(),
    // Language for code blocks (if applicable)
    language: v.optional(v.string()),
    // Order/index among siblings
    order: v.number(),
    // Block-level metadata (formatting, AI info, etc.)
    meta: v.optional(v.object({})),
    // Last update timestamp
    updatedAt: v.string(),
  })
    .index("by_messageId", ["messageId"])
    .index("by_parentBlockId", ["parentBlockId"]),

  // Attachments (files, images, PDFs, etc.)
  attachment: defineTable({
    // User who uploaded the attachment
    userId: v.id("user"),
    // Message this attachment is associated with
    messageId: v.id("message"),
    // Attachment type ("image", "pdf", "file", etc.)
    type: v.string(),
    // URL to the file
    url: v.string(),
    // Original file name
    name: v.string(),
    // File size in bytes
    size: v.optional(v.number()),
    // MIME type
    mimeType: v.optional(v.string()),
    // Attachment metadata (OCR, thumbnail, etc.)
    meta: v.optional(v.object({})),
  }),

  // Better Auth Tables
  user: defineTable({
    name: v.string(),
    email: v.string(),
    emailVerified: v.boolean(),
    image: v.optional(v.string()),
    updatedAt: v.string(),
  }).index("by_email", ["email"]),

  session: defineTable({
    token: v.string(),
    ipAddress: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    userId: v.id("user"),
    expiresAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_token", ["token"])
    .index("by_user", ["userId"]),

  account: defineTable({
    accountId: v.string(),
    providerId: v.string(),
    userId: v.id("user"),
    accessToken: v.optional(v.string()),
    refreshToken: v.optional(v.string()),
    idToken: v.optional(v.string()),
    accessTokenExpiresAt: v.optional(v.string()),
    refreshTokenExpiresAt: v.optional(v.string()),
    scope: v.optional(v.string()),
    password: v.optional(v.string()),
    updatedAt: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_provider", ["userId", "providerId"])
    .index("by_provider_account", ["providerId", "accountId"]),

  verification: defineTable({
    identifier: v.string(),
    value: v.string(),
    expiresAt: v.string(),
    updatedAt: v.string(),
  }).index("by_identifier_and_value", ["identifier", "value"]),
});