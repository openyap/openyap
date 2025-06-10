import { internal } from "../_generated/api";
import type { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getUserChats = query({
  args: { sessionToken: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken: args.sessionToken,
    });

    if (!session) {
      throw new Error("Unauthorized");
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
