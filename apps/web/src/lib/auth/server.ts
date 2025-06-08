import { betterAuth } from "better-auth";
import { captcha } from "better-auth/plugins";
import { convexAdapter } from "@better-auth-kit/convex";
import { ConvexHttpClient } from "convex/browser";

const convexClient = new ConvexHttpClient(process.env.VITE_CONVEX_URL as string, {
  logger: false,
});
 
export const auth = betterAuth({
  database: convexAdapter(convexClient),
  socialProviders: {
    google: { 
      clientId: process.env.GOOGLE_CLIENT_ID as string, 
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string, 
    }, 
  },
  plugins: [
    captcha({
      provider: "cloudflare-turnstile",
      secretKey: process.env.TURNSTILE_SECRET_KEY as string, 
    }),
  ],
}) 