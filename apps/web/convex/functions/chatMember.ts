import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";

export const createChatMember = internalMutation({
  args: {
    chatId: v.id("chat"),
    userId: v.id("user"),
    role: v.optional(v.string()),
    invitedBy: v.optional(v.id("user")),
    pinnedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { chatId, userId, role, invitedBy, pinnedAt } = args;

    const now = new Date().toISOString();
    await ctx.db.insert("chatMember", {
      chatId,
      userId,
      role,
      invitedBy,
      pinnedAt,
      joinedAt: now,
      updatedAt: now,
    });
  },
});

export const getChatMember = internalQuery({
  args: {
    chatId: v.id("chat"),
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const { chatId, userId } = args;

    const chatMember = await ctx.db.query("chatMember").filter((q) => q.eq(q.field("chatId"), chatId)).filter((q) => q.eq(q.field("userId"), userId)).first();
    return chatMember;
  },
}); 

export const updateChatMember = internalMutation({
  args: {
    chatId: v.id("chat"),
    userId: v.id("user"),
    role: v.optional(v.string()),
    invitedBy: v.optional(v.id("user")),
    pinnedAt: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { sessionToken, chatId, userId, ...fields } = args;

    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken,
    });

    if (!session) {
      throw new Error("Unauthorized");
    }

    const chatMember = await ctx.runQuery(internal.functions.chatMember.getChatMember, {
      chatId,
      userId,
    });
    if (!chatMember) {
      return;
    }

    const patch: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    const keys = [
      "role" as const,
      "invitedBy" as const,
      "pinnedAt" as const,
    ];

    for (const key of keys) {
      if (fields[key] !== undefined) patch[key] = fields[key];
      if (fields[key] === "unpin") patch[key] = undefined;
    }

    await ctx.db.patch(chatMember._id, patch);
  },
});

export const deleteChatMember = internalMutation({
  args: {
    chatId: v.id("chat"),
    userId: v.id("user"),
  },
  handler: async (ctx, args) => {
    const { chatId, userId } = args;

    const chatMember = await ctx.runQuery(internal.functions.chatMember.getChatMember, {
      chatId,
      userId,
    });
    if (!chatMember) {
      return;
    }

    await ctx.db.delete(chatMember._id);
  },
});