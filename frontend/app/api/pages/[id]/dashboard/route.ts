import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import type { DashboardResponse } from "@/types/dashboard"
import fs from "fs"
import path from "path"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: pageId } = await context.params
  const searchParams = request.nextUrl.searchParams
  const useMock = searchParams.get("mock") === "true"

  // Check Auth.js session server-side
  const session = await auth()

  // Allow mock mode explicitly for testing UI without Facebook auth/backend
  if (useMock) {
    try {
      const examplePath = path.resolve(process.cwd(), "../docs/dashboard.example.json")
      if (fs.existsSync(examplePath)) {
        const raw = fs.readFileSync(examplePath, "utf-8")
        const data = JSON.parse(raw) as DashboardResponse
        return NextResponse.json(data)
      }
    } catch {
      // fallback to backend
    }
  }

  if (!session?.accessToken) {
    return NextResponse.json(
      { error: "Unauthorized: You must be logged in with Facebook to access this Page dashboard." },
      { status: 401 }
    )
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
  const targetUrl = `${backendUrl}/api/v1/pages/${pageId}/dashboard`

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      // Ensure fresh data
      cache: "no-store",
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }))
      return NextResponse.json(
        { error: errorBody.detail || `Backend returned error ${res.status}` },
        { status: res.status }
      )
    }

    const data: DashboardResponse = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to connect to backend server"
    return NextResponse.json(
      {
        error: `Could not connect to dashboard backend at ${backendUrl}. Ensure the FastAPI server is running. (${errorMsg})`,
      },
      { status: 502 }
    )
  }
}
