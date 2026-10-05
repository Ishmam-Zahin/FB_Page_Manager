import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: pageId } = await context.params
  const session = await auth()

  const urlUserId = request.nextUrl.searchParams.get("user_id")
  const effectiveUserId = session?.userId || session?.user?.id || urlUserId

  if (!effectiveUserId) {
    return NextResponse.json(
      { error: "Unauthorized: User ID not found in session." },
      { status: 401 }
    )
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
  const targetUrl = `${backendUrl}/api/v1/chat/conversations?user_id=${encodeURIComponent(
    effectiveUserId
  )}&page_id=${encodeURIComponent(pageId)}`

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }))
      return NextResponse.json(
        { error: errorBody.detail || `Backend returned error ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to load conversations"
    return NextResponse.json(
      { error: `Could not connect to backend server: ${errorMsg}` },
      { status: 502 }
    )
  }
}
