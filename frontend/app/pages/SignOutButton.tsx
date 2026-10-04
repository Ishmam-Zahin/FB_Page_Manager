"use client"

import { signOut } from "next-auth/react"
import { useState } from "react"

export function SignOutButton() {
  const [loading, setLoading] = useState(false)

  const handleSignOut = async () => {
    setLoading(true)
    await signOut({ callbackUrl: "/login" })
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={loading}
      id="sign-out-btn"
      className="
        text-sm font-medium
        text-slate-300 hover:text-white
        bg-white/5 hover:bg-white/10
        border border-white/10
        px-4 py-2 rounded-lg
        transition-all duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        focus:outline-none focus:ring-2 focus:ring-white/20
      "
    >
      {loading ? "Signing out…" : "Sign out"}
    </button>
  )
}
