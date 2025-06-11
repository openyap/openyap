import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { mutation, query } from "../_generated/server";
import { v } from "convex/values";

export const getUserChats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return [];
    }

    const userId = session.userId as Id<"user">;

    const chats = await ctx.db
      .query("chat")
      .filter((q) => q.eq(q.field("ownerId"), userId))
      .order("desc")
      .collect();

    return chats;
  },
});

export const getChatMessages = query({
  args: {
    chatId: v.id("chat"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return [];
    }

    const messages = await ctx.db
      .query("message")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .order("asc")
      .collect();
    return messages;
  },
});

export const createChat = mutation({
  args: {
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    visibility: v.union(
      v.literal("private"),
      v.literal("shared"),
      v.literal("public")
    ),
    shareToken: v.optional(v.string()),
    provider: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { sessionToken, ...chatData } = args;

    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken,
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const userId = session.userId as Id<"user">;

    const now = new Date().toISOString();
    const chatId = await ctx.db.insert("chat", {
      ...chatData,
      updatedAt: now,
      ownerId: userId,
    });

    return chatId;
  },
});

export const updateChat = mutation({
  args: {
    chatId: v.id("chat"),
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    visibility: v.optional(
      v.union(
        v.literal("private"),
        v.literal("shared"),
        v.literal("public")
      )
    ),
    shareToken: v.optional(v.string()),
    provider: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { sessionToken, chatId, ...fields } = args;

    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken,
    });

    if (!session) throw new Error("Unauthorized");

    const userId = session.userId as Id<"user">;
    const chat = await ctx.db.get(chatId);

    if (!chat) throw new Error("Chat not found");
    if (chat.ownerId !== userId) throw new Error("Unauthorized");

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const keys = [
      "title" as const,
      "tags" as const,
      "description" as const,
      "visibility" as const,
      "shareToken" as const,
      "provider" as const,
    ];
    for (const key of keys) {
      if (fields[key] !== undefined) patch[key] = fields[key];
    }

    await ctx.db.patch(chatId, patch);
    return chatId;
  },
});

export const deleteChat = mutation({
  args: {
    chatId: v.id("chat"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { sessionToken, chatId } = args;

    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken,
    });

    if (!session) {
      return;
    }

    const userId = session.userId as Id<"user">;

    const chat = await ctx.db.get(chatId);

    if (!chat) {
      return;
    }

    if (chat.ownerId !== userId) {
      return;
    }

    const messages = await ctx.db.query("message").filter((q) => q.eq(q.field("chatId"), chatId)).collect();
    await Promise.all(
      messages.map((m) =>
        ctx.runMutation(internal.functions.message.deleteMessage, { messageId: m._id })
      )
    );

    await ctx.db.delete(chatId);
  },
}); 