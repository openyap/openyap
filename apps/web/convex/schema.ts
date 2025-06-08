import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
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