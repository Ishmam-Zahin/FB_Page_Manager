import type { Metadata } from "next"
import { LoginButton } from "./LoginButton"

export const metadata: Metadata = {
  title: "Sign In — FB Pages Dashboard",
  description: "Log in with Facebook to manage and analyse your Pages.",
}

const ERROR_MESSAGES: Record<string, string> = {
  OAuthCallback: "Something went wrong during sign-in. Please try again.",
  OAuthSignin: "Could not start the sign-in flow. Please try again.",
  AccessDenied:
    "Access was denied. You may have cancelled the login or your account isn't authorised.",
  Callback:
    "An error occurred during the callback. Please try again.",
  Configuration:
    "Could not connect to Facebook authentication servers. Please try again.",
  Default: "An unexpected error occurred. Please try again.",
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default)
    : null

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none fixed inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(24,119,242,0.12) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 w-full max-w-sm">
        {/* Card */}
        <div className="bg-slate-900 border border-white/8 rounded-2xl shadow-2xl shadow-black/60 p-8 flex flex-col gap-6">

          {/* Logo + heading */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#1877f2]/10 border border-[#1877f2]/30 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="#1877f2"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                FB Pages Dashboard
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Manage and analyse your Facebook Pages in one place.
              </p>
            </div>
          </div>

          {/* Error banner */}
          {errorMessage && (
            <div
              role="alert"
              id="login-error-message"
              className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-300 text-sm rounded-xl px-4 py-3"
            >
              <svg
                className="mt-0.5 shrink-0"
                width="16"
                height="16"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0110 5.586V5a1 1 0 112 0v.586A3 3 0 0111.866 8.5 1 1 0 0110 7zm0 4a1 1 0 100 2 1 1 0 000-2z"
                  clipRule="evenodd"
                />
              </svg>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Sign-in button */}
          <LoginButton />

          {/* Divider */}
          <hr className="border-white/8" />

          {/* Dev-mode notice */}
          <p className="text-xs text-slate-500 text-center leading-relaxed">
            <span className="text-slate-400 font-medium">Development mode:</span>{" "}
            Only users added as Testers in the Facebook developer console can sign in.
            If you can't log in, ask the owner to add your Facebook account as a Tester.
          </p>
        </div>
      </div>
    </main>
  )
}
