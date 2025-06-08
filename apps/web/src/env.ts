import { Schema } from "effect"
import { createEnv } from "@t3-oss/env-core";

export const env = createEnv({
  server: {
    BETTER_AUTH_URL: Schema.standardSchemaV1(Schema.NonEmptyString),
    BETTER_AUTH_SECRET: Schema.standardSchemaV1(Schema.NonEmptyString),
    GOOGLE_CLIENT_ID: Schema.standardSchemaV1(Schema.NonEmptyString),
    GOOGLE_CLIENT_SECRET: Schema.standardSchemaV1(Schema.NonEmptyString),
    OPENROUTER_API_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
    TURNSTILE_SECRET_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
  },
  client: {
    VITE_CONVEX_URL: Schema.standardSchemaV1(Schema.NonEmptyString),
    VITE_TURNSTILE_SITE_KEY: Schema.standardSchemaV1(Schema.NonEmptyString),
  },
  clientPrefix: "VITE_",
  runtimeEnv: process.env,
});
