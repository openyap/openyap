/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as betterAuth from "../betterAuth.js";
import type * as functions_attachment from "../functions/attachment.js";
import type * as functions_chat from "../functions/chat.js";
import type * as functions_chatMember from "../functions/chatMember.js";
import type * as functions_message from "../functions/message.js";
import type * as functions_user from "../functions/user.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  betterAuth: typeof betterAuth;
  "functions/attachment": typeof functions_attachment;
  "functions/chat": typeof functions_chat;
  "functions/chatMember": typeof functions_chatMember;
  "functions/message": typeof functions_message;
  "functions/user": typeof functions_user;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
