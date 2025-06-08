import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";
import { env } from "~/env";

const convexClient = new ConvexHttpClient(env.VITE_CONVEX_URL, {
  logger: false,
});
 
export const auth = betterAuth({
  database: convexAdapter(convexClient),
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