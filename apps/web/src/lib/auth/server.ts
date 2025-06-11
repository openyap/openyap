import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { convexAdapter } from "@better-auth-kit/convex";
import { env } from "~/env";
import { convexServer } from "~/lib/db/server";

export const auth = betterAuth({
  database: convexAdapter(convexServer),
  socialProviders: {
    google: { 
      clientId: env.GOOGLE_CLIENT_ID, 
      clientSecret: env.GOOGLE_CLIENT_SECRET, 
    }, 
  },
  plugins: [
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: env.TURNSTILE_SECRET_KEY, 
    }),
  ],
}) 