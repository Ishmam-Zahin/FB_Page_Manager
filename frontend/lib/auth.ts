import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "email,pages_show_list,pages_read_engagement,read_insights,pages_read_user_content",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Persist the Facebook user access token on first sign-in
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      return token
    },
    async session({ session, token }) {
      // Expose the access token to server-side code via `auth()`
      // It is NEVER sent to the client
      session.accessToken = token.accessToken
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
