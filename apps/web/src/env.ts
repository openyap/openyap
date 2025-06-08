// TODO: fix this
import { Config, Effect, Schema } from "effect"

const EnvSchema = Schema.Struct({
  BETTER_AUTH_URL: Schema.Redacted(Schema.NonEmptyString),
  BETTER_AUTH_SECRET: Schema.Redacted(Schema.NonEmptyString),
  GOOGLE_CLIENT_ID: Schema.Redacted(Schema.NonEmptyString),
  GOOGLE_CLIENT_SECRET: Schema.Redacted(Schema.NonEmptyString),
  OPENROUTER_API_KEY: Schema.Redacted(Schema.NonEmptyString),
  TURNSTILE_SECRET_KEY: Schema.Redacted(Schema.NonEmptyString),
  VITE_CONVEX_URL: Schema.NonEmptyString,
  VITE_TURNSTILE_SITE_KEY: Schema.NonEmptyString,
})

const config = Config.all({
  BETTER_AUTH_URL: Config.string("BETTER_AUTH_URL"),
  BETTER_AUTH_SECRET: Config.string("BETTER_AUTH_SECRET"),
  GOOGLE_CLIENT_ID: Config.string("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: Config.string("GOOGLE_CLIENT_SECRET"),
  OPENROUTER_API_KEY: Config.string("OPENROUTER_API_KEY"),
  TURNSTILE_SECRET_KEY: Config.string("TURNSTILE_SECRET_KEY"),
  VITE_CONVEX_URL: Config.string("VITE_CONVEX_URL"),
  VITE_TURNSTILE_SITE_KEY: Config.string("VITE_TURNSTILE_SITE_KEY"),
})

const program = Effect.gen(function* () {
  const rawConfig = yield* config
  const decodedConfig = yield* Schema.decode(EnvSchema)(rawConfig)
  return decodedConfig
}).pipe(
  Effect.tap(() => Effect.log("Environment variables loaded successfully")),
  Effect.catchTag("ConfigError", (error) =>
    Effect.sync(() => {
    console.error("❌ Missing environment variable:", error.message)
    process.exit(1)
    })
  ),
  Effect.catchTag("ParseError", (error) =>
    Effect.sync(() => {
    console.error("❌ Invalid environment variables:")
    for (const issue of Object.values(error.issue as Record<string, any>)) {
      console.error(`  - ${issue.path?.join(".") ?? ""}: ${issue.message}`)
    }
    process.exit(1)
  })
  ),
)

export const env = await Effect.runPromise(program)