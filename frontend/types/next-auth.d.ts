import type { DefaultSession } from "next-auth"
import type { DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session extends DefaultSession {
    /** Facebook user access token — only available server-side via `auth()` */
    accessToken?: string
    /** Facebook user ID — available server-side via `auth()` */
    userId?: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    accessToken?: string
    userId?: string
  }
}
