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
      // TODO: handle this
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

export const createChat = mutation({
  args: {
    title: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    ownerId: v.id("user"),
    visibility: v.union(
      v.literal("private"),
      v.literal("shared"),
      v.literal("public")
    ),
    shareToken: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const chatId = await ctx.db.insert("chat", {
      ...args,
      updatedAt: now,
    });
    return chatId;
  },
});