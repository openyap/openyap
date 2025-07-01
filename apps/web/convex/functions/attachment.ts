import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const MAX_IMAGE_SIZE = 25 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

const ALLOWED_FILE_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  "application/json",
  "text/csv",
  "application/zip",
  "application/x-zip-compressed",
];

export const generateUploadUrl = mutation({
  args: {
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const createAttachment = mutation({
  args: {
    storageId: v.id("_storage"),
    messageId: v.id("message"),
    name: v.string(),
    size: v.number(),
    mimeType: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const userId = session.userId as Id<"user">;

    const maxSize = ALLOWED_IMAGE_TYPES.includes(args.mimeType)
      ? MAX_IMAGE_SIZE
      : MAX_FILE_SIZE;

    if (args.size > maxSize) {
      throw new Error(
        `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`,
      );
    }

    if (!ALLOWED_FILE_TYPES.includes(args.mimeType)) {
      throw new Error(`File type ${args.mimeType} is not allowed`);
    }

    let type = "file";
    if (ALLOWED_IMAGE_TYPES.includes(args.mimeType)) {
      type = "image";
    } else if (args.mimeType === "application/pdf") {
      type = "pdf";
    } else if (ALLOWED_DOCUMENT_TYPES.includes(args.mimeType)) {
      type = "document";
    }

    const url = await ctx.storage.getUrl(args.storageId);
    if (!url) {
      throw new Error("Failed to get file URL");
    }

    const attachmentId = await ctx.db.insert("attachment", {
      userId,
      messageId: args.messageId,
      type,
      url,
      name: args.name,
      size: args.size,
      mimeType: args.mimeType,
    });

    return attachmentId;
  },
});

export const getMessageAttachments = query({
  args: {
    messageId: v.id("message"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return [];
    }

    const attachments = await ctx.db
      .query("attachment")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .collect();

    return attachments;
  },
});

export const getAttachment = query({
  args: {
    attachmentId: v.id("attachment"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return null;
    }

    const attachment = await ctx.db.get(args.attachmentId);

    if (attachment) {
      const message = await ctx.db.get(attachment.messageId);
      if (!message) {
        return null;
      }

      const chatMember = await ctx.db
        .query("chatMember")
        .withIndex("by_userId", (q) =>
          q.eq("userId", session.userId as Id<"user">),
        )
        .filter((q) => q.eq(q.field("chatId"), message.chatId))
        .unique();

      if (!chatMember) {
        return null;
      }
    }

    return attachment;
  },
});

export const deleteAttachment = mutation({
  args: {
    attachmentId: v.id("attachment"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      throw new Error("Attachment not found");
    }

    if (attachment.userId !== session.userId) {
      throw new Error("Not authorized to delete this attachment");
    }

    const storageId = attachment.url.split("/").pop() as Id<"_storage">;
    if (storageId) {
      await ctx.storage.delete(storageId);
    }

    await ctx.db.delete(args.attachmentId);
  },
});

export const getAttachmentInternal = internalQuery({
  args: {
    attachmentId: v.id("attachment"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.attachmentId);
  },
});

export const createAttachmentInternal = internalMutation({
  args: {
    userId: v.id("user"),
    messageId: v.id("message"),
    type: v.string(),
    url: v.string(),
    name: v.string(),
    size: v.optional(v.number()),
    mimeType: v.optional(v.string()),
    extractedText: v.optional(v.string()),
    meta: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("attachment", args);
  },
});

export const updateAttachmentInternal = internalMutation({
  args: {
    attachmentId: v.id("attachment"),
    extractedText: v.optional(v.string()),
    meta: v.optional(v.object({})),
  },
  handler: async (ctx, args) => {
    const patch: Record<string, unknown> = {};

    if (args.extractedText !== undefined) {
      patch.extractedText = args.extractedText;
    }

    if (args.meta !== undefined) {
      patch.meta = args.meta;
    }

    if (Object.keys(patch).length > 0) {
      await ctx.db.patch(args.attachmentId, patch);
    }
  },
});

export const deleteAttachmentsByMessageId = internalMutation({
  args: {
    messageId: v.id("message"),
  },
  handler: async (ctx, args) => {
    const attachments = await ctx.db
      .query("attachment")
      .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
      .collect();

    await Promise.all(
      attachments.map(async (attachment) => {
        try {
          const storageId = attachment.url.split("/").pop() as Id<"_storage">;
          if (storageId) {
            await ctx.storage.delete(storageId);
          }
        } catch (error) {
          console.error("Failed to delete file from storage:", error);
        }

        await ctx.db.delete(attachment._id);
      }),
    );
  },
});

export const deleteAttachmentsByMessageIds = internalMutation({
  args: {
    messageIds: v.array(v.id("message")),
  },
  handler: async (ctx, args) => {
    await Promise.all(
      args.messageIds.map(async (messageId) => {
        await ctx.runMutation(
          internal.functions.attachment.deleteAttachmentsByMessageId,
          {
            messageId,
          },
        );
      }),
    );
  },
});
