import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { SignOutButton } from "./SignOutButton"

export const metadata: Metadata = {
  title: "Your Pages — FB Pages Dashboard",
  description: "Select a Facebook Page to view its analytics and AI insights.",
}

const GRAPH_API_VERSION = "v22.0"

interface FacebookPicture {
  data: {
    url: string
    is_silhouette: boolean
  }
}

interface FacebookPage {
  id: string
  name: string
  category: string
  picture?: FacebookPicture
}

interface GraphApiResponse {
  data: FacebookPage[]
  error?: {
    message: string
    code: number
  }
}

async function fetchPages(accessToken: string): Promise<GraphApiResponse> {
  const url =
    `https://graph.facebook.com/${GRAPH_API_VERSION}/me/accounts` +
    `?fields=id,name,category,picture{url}` +
    `&access_token=${accessToken}`

  const res = await fetch(url, { cache: "no-store" })
  return res.json() as Promise<GraphApiResponse>
}

interface PagesPageProps {
  searchParams: Promise<{ retry?: string }>
}

export default async function PagesPage({ searchParams }: PagesPageProps) {
  // Ensure user is authenticated (middleware already guards this, but double-check)
  const session = await auth()
  if (!session?.accessToken) {
    redirect("/login")
  }

  // Consume searchParams to satisfy Next.js dynamic usage
  await searchParams

  let pages: FacebookPage[] = []
  let apiError: string | null = null

  try {
    const result = await fetchPages(session.accessToken)
    if (result.error) {
      apiError = result.error.message
    } else {
      pages = result.data ?? []
    }
  } catch {
    apiError = "Failed to reach the Facebook API. Please check your connection."
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Subtle top glow */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(24,119,242,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Header */}
      <header className="relative z-10 border-b border-white/8 bg-slate-950/80 backdrop-blur-sm sticky top-0">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#1877f2]/10 border border-[#1877f2]/30 flex items-center justify-center shrink-0">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="#1877f2"
                aria-hidden="true"
              >
                <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.513c-1.491 0-1.956.93-1.956 1.886v2.268h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
              </svg>
            </div>
            <span className="font-semibold text-white text-sm hidden sm:block">
              FB Pages Dashboard
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span
              id="user-name"
              className="text-sm text-slate-400 hidden sm:block"
            >
              {session.user?.name}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-bold text-white mb-1">Your Facebook Pages</h1>
        <p className="text-slate-400 text-sm mb-8">
          Select a Page to view its insights and analytics.
        </p>

        {/* Error state */}
        {apiError && (
          <div
            id="pages-error"
            className="flex flex-col items-center gap-6 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#ef4444"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">
                Could not load Pages
              </p>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                {apiError}
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/pages"
                id="retry-btn"
                className="px-5 py-2.5 bg-[#1877f2] hover:bg-[#166fe5] text-white text-sm font-medium rounded-xl transition-colors cursor-pointer"
              >
                Retry
              </Link>
              <SignOutButton />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!apiError && pages.length === 0 && (
          <div
            id="pages-empty"
            className="flex flex-col items-center gap-4 py-20 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-white/8 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6M9 13h4" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">No Pages found</p>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                Make sure you selected a Page when prompted during Facebook login.
                If you manage Pages, try signing out and logging in again with
                Pages access enabled.
              </p>
            </div>
            <SignOutButton />
          </div>
        )}

        {/* Pages grid */}
        {!apiError && pages.length > 0 && (
          <ul
            id="pages-grid"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {pages.map((page) => (
              <li key={page.id}>
                <Link
                  href={`/pages/${page.id}`}
                  id={`page-card-${page.id}`}
                  className="
                    group flex items-center gap-4
                    bg-slate-900 hover:bg-slate-800
                    border border-white/8 hover:border-white/16
                    rounded-2xl p-4
                    transition-all duration-200
                    shadow-sm hover:shadow-lg hover:shadow-black/30
                    focus:outline-none focus:ring-2 focus:ring-[#1877f2]/50
                    cursor-pointer
                  "
                >
                  {/* Page picture */}
                  <div className="relative w-14 h-14 shrink-0 rounded-full overflow-hidden bg-slate-800 border border-white/8">
                    {page.picture?.data?.url && !page.picture.data.is_silhouette ? (
                      <Image
                        src={page.picture.data.url}
                        alt={`${page.name} page picture`}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-slate-400 text-xl font-bold">
                        {page.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Page info */}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-sm truncate group-hover:text-blue-300 transition-colors">
                      {page.name}
                    </p>
                    <p className="text-slate-400 text-xs mt-0.5 truncate">
                      {page.category}
                    </p>
                  </div>

                  {/* Arrow */}
                  <svg
                    className="shrink-0 text-slate-600 group-hover:text-blue-400 transition-colors"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
