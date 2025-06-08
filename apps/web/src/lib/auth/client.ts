import { createAuthClient } from "better-auth/react"
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";

export const authClient = createAuthClient();

export const getClientIP = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  const ip = forwarded?.split(',')[0].trim() || 
            realIP || 
            cfConnectingIP || 
            'unknown'
  
  return ip
})