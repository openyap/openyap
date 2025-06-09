import { mutation, query, internalAction } from "./_generated/server";
import { v } from "convex/values";

export const sendMessage = mutation({
  args: { content: v.string(), userId: v.id("user") },
  handler: async (ctx, args) => {
    // TODO: implement
  },
});

export const listMessages = query({
  args: {},
  handler: async (ctx) => {
    // TODO: implement
  },
});

export const generateAiResponse = internalAction({
  args: { messageId: v.id("message") },
  handler: async (ctx, args) => {
    // TODO: implement
  },
});
