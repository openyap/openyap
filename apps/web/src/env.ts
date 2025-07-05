import { createEnv } from "@t3-oss/env-core";
import { Schema } from "effect";

export const env = createEnv({
  server: {
    BETTER_AUTH_URL: Schema.standardSchemaV1(Schema.NonEmptyString),
    BETTER_AUTH_SECRET: Schema.standardSchemaV1(Schema.NonEmptyString),
    GOOGLE_CLIENT_ID: Schema.standardSchemaV1(Schema.NonEmptyString),
    GOOGLE_CLIENT_SECRET: Schema.standardSchemaV1(Schema.NonEmptyString),
    OPENROUTER_API_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
    EXA_API_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
    TURNSTILE_SECRET_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
  },
  client: {
    VITE_BRANDFETCH_API_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
    VITE_CONVEX_URL: Schema.standardSchemaV1(Schema.NonEmptyString),
    VITE_TURNSTILE_SITE_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
  },
  clientPrefix: "VITE_",
  runtimeEnv: {
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    EXA_API_KEY: process.env.EXA_API_KEY,
    TURNSTILE_SECRET_KEY: process.env.TURNSTILE_SECRET_KEY,
    VITE_BRANDFETCH_API_KEY: import.meta.env.VITE_BRANDFETCH_API_KEY,
    VITE_CONVEX_URL: import.meta.env.VITE_CONVEX_URL,
    VITE_TURNSTILE_SITE_KEY: import.meta.env.VITE_TURNSTILE_SITE_KEY,
  },
  emptyStringAsUndefined: true,
});
