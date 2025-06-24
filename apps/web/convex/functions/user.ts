import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";

export const updateUserPreferences = mutation({
  args: {
    preferences: v.object({
      theme: v.optional(v.string()),
      language: v.optional(v.string()),
      defaultProvider: v.optional(v.string()),
      defaultModel: v.optional(v.string()),
    }),
    sessionToken: v.string(),
  },
  handler: async (ctx, args) => {
    const { preferences, sessionToken } = args;
    const session = await ctx.runQuery(internal.betterAuth.getSession, {
      sessionToken,
    });

    if (!session) {
      return null;
    }

    await ctx.db.patch(session.userId, {
      preferences: {
        ...(preferences.theme && { theme: preferences.theme }),
        ...(preferences.language && { language: preferences.language }),
        ...(preferences.defaultProvider && {
          defaultProvider: preferences.defaultProvider,
        }),
        ...(preferences.defaultModel && {
          defaultModel: preferences.defaultModel,
        }),
      },
    });
  },
});
