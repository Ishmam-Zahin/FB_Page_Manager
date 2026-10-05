"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"

export function LoginButton() {
  const [loading, setLoading] = useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    await signIn("facebook", { callbackUrl: "/pages" })
    // If signIn redirects, loading stays true — that's fine
  }

  return (
    <button
      onClick={handleSignIn}
      disabled={loading}
      id="facebook-signin-btn"
      className="
        flex items-center justify-center gap-3 w-full
        bg-[#1877f2] hover:bg-[#166fe5] active:bg-[#1464d8]
        cursor-pointer
        disabled:opacity-60 disabled:cursor-not-allowed
        text-white font-semibold text-base
        px-6 py-3.5 rounded-xl
        transition-all duration-150
        shadow-lg shadow-blue-900/30
        focus:outline-none focus:ring-2 focus:ring-[#1877f2] focus:ring-offset-2 focus:ring-offset-slate-900
      "
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-5 w-5 text-white"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8z"
            />
          </svg>
          Connecting…
        </>
      ) : (
        <>
          {/* Facebook "f" logo */}
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="white"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
          </svg>
          Continue with Facebook
        </>
      )}
    </button>
  )
}
