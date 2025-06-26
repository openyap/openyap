import { v } from "convex/values";
import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "../_generated/server";

export const createUserMessage = mutation({
  args: {
    content: v.string(),
    chatId: v.id("chat"),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return;
    }

    const userId = session.userId as Id<"user">;

    await ctx.runMutation(internal.functions.message.createMessage, {
      chatId: args.chatId,
      userId,
      role: "user",
      content: args.content,
      status: "created",
      history: [
        {
          content: args.content,
          version: 0,
          status: "created",
        },
      ],
    });
  },
});

export const updateUserMessage = mutation({
  args: {
    messageId: v.id("message"),
    content: v.optional(v.string()),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return;
    }

    await ctx.runMutation(internal.functions.message.updateMessage, {
      messageId: args.messageId,
      content: args.content,
      status: args.status,
      error: args.error,
    });
  },
});

export const createAiMessage = mutation({
  args: {
    chatId: v.id("chat"),
    provider: v.string(),
    model: v.string(),
    sessionToken: v.string(),
  },
  handler: async (ctx, args): Promise<Id<"message"> | null> => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return null;
    }

    const messageId = await ctx.runMutation(
      internal.functions.message.createMessage,
      {
        chatId: args.chatId,
        role: "assistant",
        content: "",
        status: "created",
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      }
    );

    return messageId;
  },
});

export const updateAiMessage = mutation({
  args: {
    messageId: v.id("message"),
    content: v.optional(v.string()),
    reasoning: v.optional(
      v.object({
        text: v.string(),
        details: v.array(v.object({ text: v.string() })),
        duration: v.number(),
        reasoningEffort: v.optional(v.string()),
      })
    ),
    status: v.optional(v.string()),
    sessionToken: v.string(),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    usage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })
    ),
    historyEntry: v.optional(
      v.object({
        version: v.number(),
        content: v.string(),
        status: v.string(),
        reasoning: v.optional(
          v.object({
            text: v.string(),
            details: v.array(v.object({ text: v.string() })),
            duration: v.number(),
            reasoningEffort: v.optional(v.string()),
          })
        ),
        provider: v.optional(v.string()),
        model: v.optional(v.string()),
        usage: v.optional(
          v.object({
            promptTokens: v.number(),
            completionTokens: v.number(),
            totalTokens: v.number(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return;
    }

    await ctx.runMutation(internal.functions.message.updateMessage, {
      messageId: args.messageId,
      content: args.content,
      reasoning: args.reasoning,
      status: args.status,
      model: args.model,
      provider: args.provider,
      usage: args.usage,
      historyEntry: args.historyEntry,
    });
  },
});

export const getMessageStatus = query({
  args: { messageId: v.id("message"), sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      return null;
    }

    const message = await ctx.db.get(args.messageId);
    return message?.status;
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
    reasoning: v.optional(
      v.object({
        text: v.string(),
        details: v.array(v.object({ text: v.string() })),
        duration: v.number(),
        reasoningEffort: v.optional(v.string()),
      })
    ),
    status: v.string(),
    error: v.optional(v.string()),
    usage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })
    ),
    tools: v.optional(v.array(v.any())),
    sources: v.optional(v.array(v.any())),
    history: v.optional(
      v.array(
        v.object({
          version: v.number(),
          content: v.string(),
          reasoning: v.optional(
            v.object({
              text: v.string(),
              details: v.array(v.object({ text: v.string() })),
              duration: v.number(),
              reasoningEffort: v.optional(v.string()),
            })
          ),
          provider: v.optional(v.string()),
          model: v.optional(v.string()),
          usage: v.optional(
            v.object({
              promptTokens: v.number(),
              completionTokens: v.number(),
              totalTokens: v.number(),
            })
          ),
          status: v.string(),
          error: v.optional(v.string()),
          tools: v.optional(v.array(v.any())),
          sources: v.optional(v.array(v.any())),
        })
      )
    ),
    webSearchResults: v.optional(v.any()),
    attachments: v.optional(v.array(v.id("attachment"))),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const history = args.history ?? [];
    const newHistory = history.map((h) => ({ ...h, createdAt: now }));
    const messageId = await ctx.db.insert("message", {
      ...args,
      history: newHistory,
      updatedAt: now,
    });
    return messageId;
  },
});

export const getMessage = internalQuery({
  args: { messageId: v.id("message") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.messageId);
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
    reasoning: v.optional(
      v.object({
        text: v.string(),
        details: v.array(v.object({ text: v.string() })),
        duration: v.number(),
        reasoningEffort: v.optional(v.string()),
      })
    ),
    status: v.optional(v.string()),
    error: v.optional(v.string()),
    usage: v.optional(
      v.object({
        promptTokens: v.number(),
        completionTokens: v.number(),
        totalTokens: v.number(),
      })
    ),
    tools: v.optional(v.array(v.any())),
    sources: v.optional(v.array(v.any())),
    historyEntry: v.optional(
      v.object({
        version: v.number(),
        content: v.string(),
        reasoning: v.optional(
          v.object({
            text: v.string(),
            details: v.array(v.object({ text: v.string() })),
            duration: v.number(),
            reasoningEffort: v.optional(v.string()),
          })
        ),
        provider: v.optional(v.string()),
        model: v.optional(v.string()),
        usage: v.optional(
          v.object({
            promptTokens: v.number(),
            completionTokens: v.number(),
            totalTokens: v.number(),
          })
        ),
        status: v.optional(v.string()),
        error: v.optional(v.string()),
        tools: v.optional(v.array(v.any())),
        sources: v.optional(v.array(v.any())),
      })
    ),
    webSearchResults: v.optional(v.any()),
    attachments: v.optional(v.array(v.id("attachment"))),
    embedding: v.optional(v.array(v.number())),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) throw new Error("Message not found");
    const history = message.history ?? [];
    const now = new Date().toISOString();
    const historyEntry = args.historyEntry
      ? { ...args.historyEntry, createdAt: now }
      : undefined;
    const newHistory = historyEntry ? [...history, historyEntry] : history;
    const patch: Record<string, unknown> = {
      history: newHistory,
      updatedAt: now,
    };
    const keys = [
      "parentId" as const,
      "branchRootId" as const,
      "userId" as const,
      "role" as const,
      "provider" as const,
      "model" as const,
      "content" as const,
      "reasoning" as const,
      "status" as const,
      "error" as const,
      "usage" as const,
      "tools" as const,
      "sources" as const,
      "webSearchResults" as const,
      "attachments" as const,
      "embedding" as const,
    ];
    for (const key of keys) {
      if (args[key] !== undefined) patch[key] = args[key];
    }
    await ctx.db.patch(args.messageId, patch);
  },
});

export const deleteMessage = internalMutation({
  args: {
    messageId: v.id("message"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});
