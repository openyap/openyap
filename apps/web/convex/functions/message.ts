import { mutation, internalQuery, internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { internal } from "../_generated/api";

export const generateUserMessage = mutation({
  args: { 
    content: v.string(), 
    userId: v.id("user"), 
    chatId: v.id("chat"), 
    parentMessageId: v.optional(v.id("message")),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.functions.message.createMessage, {
      chatId: args.chatId,
      parentId: args.parentMessageId,
      userId: args.userId,
      role: "user",
      content: args.content,
      history: [{
        content: args.content,
        version: 0,
        createdAt: new Date().toISOString(),
      }],
    });
  },
});

export const getMessage = internalQuery({
  args: { messageId: v.id("message") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
  },
});

export const getRecentMessagesForChat = internalQuery({
  args: { chatId: v.id("chat") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("message")
      .withIndex("by_chatId", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .take(10);
  },
});

// CRUD operations for messages

export const createMessage = internalMutation({
  args: {
    chatId: v.id("chat"),
    parentId: v.optional(v.id("message")),
    branchRootId: v.optional(v.id("message")),
    userId: v.optional(v.id("user")),
    role: v.string(),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    content: v.string(),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
    usage: v.optional(v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
    })),
    toolCalls: v.optional(v.array(v.any())),
    citations: v.optional(v.array(v.any())),
    history: v.optional(v.array(v.object({
      version: v.number(),
      content: v.string(),
      provider: v.optional(v.string()),
      model: v.optional(v.string()),
      usage: v.optional(v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })),
      status: v.optional(v.string()),
      error: v.optional(v.string()),
      toolCalls: v.optional(v.array(v.any())),
      citations: v.optional(v.array(v.any())),
      createdAt: v.string(),
    }))),
    webSearchResults: v.optional(v.any()),
    attachments: v.optional(v.array(v.id("attachment"))),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.insert("message", {
      ...args,
      updatedAt: new Date().toISOString(),
    });
    return message;
  },
});

export const updateMessage = internalMutation({
  args: {
    messageId: v.id("message"),
    parentId: v.optional(v.id("message")),
    branchRootId: v.optional(v.id("message")),
    userId: v.optional(v.id("user")),
    role: v.optional(v.string()),
    provider: v.optional(v.string()),
    model: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
    usage: v.optional(v.object({
      promptTokens: v.number(),
      completionTokens: v.number(),
      totalTokens: v.number(),
    })),
    toolCalls: v.optional(v.array(v.any())),
    citations: v.optional(v.array(v.any())),
    historyEntry: v.optional(v.object({
      version: v.number(),
      content: v.string(),
      provider: v.optional(v.string()),
      model: v.optional(v.string()),
      usage: v.optional(v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })),
      status: v.optional(v.string()),
      error: v.optional(v.string()),
      toolCalls: v.optional(v.array(v.any())),
      citations: v.optional(v.array(v.any())),
    })),
    webSearchResults: v.optional(v.any()),
    attachments: v.optional(v.array(v.id("attachment"))),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    const history = message.history ?? [];
    const now = new Date().toISOString();
    const historyEntry = args.historyEntry ? { ...args.historyEntry, createdAt: now } : undefined;
    const newHistory = historyEntry ? [...history, historyEntry] : history;
    await ctx.db.patch(args.messageId, {
      ...(args.parentId !== undefined && { parentId: args.parentId }),
      ...(args.branchRootId !== undefined && { branchRootId: args.branchRootId }),
      ...(args.userId !== undefined && { userId: args.userId }),
      ...(args.role !== undefined && { role: args.role }),
      ...(args.provider !== undefined && { provider: args.provider }),
      ...(args.model !== undefined && { model: args.model }),
      ...(args.content !== undefined && { content: args.content }),
      ...(args.status !== undefined && { status: args.status }),
      ...(args.error !== undefined && { error: args.error }),
      ...(args.usage !== undefined && { usage: args.usage }),
      ...(args.toolCalls !== undefined && { toolCalls: args.toolCalls }),
      ...(args.citations !== undefined && { citations: args.citations }),
      ...(args.webSearchResults !== undefined && { webSearchResults: args.webSearchResults }),
      ...(args.attachments !== undefined && { attachments: args.attachments }),
      ...(args.embedding !== undefined && { embedding: args.embedding }),
      history: newHistory,
      updatedAt: now,
    });
  },
});
