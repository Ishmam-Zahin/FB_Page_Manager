import NextAuth from "next-auth"
import Facebook from "next-auth/providers/facebook"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
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
    async jwt({ token, account, profile }) {
      // Persist the Facebook user access token and permanent Facebook User ID on first sign-in
      if (account?.access_token) {
        token.accessToken = account.access_token
      }
      // account.providerAccountId is the permanent Facebook User ID
      if (account?.providerAccountId) {
        token.userId = String(account.providerAccountId)
      } else if (profile && "id" in profile && profile.id) {
        token.userId = String(profile.id)
      }
      return token
    },
    async session({ session, token }) {
      // Expose the access token to server-side code via `auth()`
      // It is NEVER sent to the client
      session.accessToken = token.accessToken
      if (token.userId) {
        session.userId = token.userId as string
        if (session.user) {
          session.user.id = token.userId as string
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
})
