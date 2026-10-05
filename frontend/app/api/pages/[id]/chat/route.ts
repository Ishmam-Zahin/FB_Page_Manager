import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id: pageId } = await context.params
  const session = await auth()

  // Use session userId if available, or allow fallback userId from request body for testing/local
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON request body" }, { status: 400 })
  }

  const effectiveUserId = session?.userId || session?.user?.id || body.user_id
  if (!effectiveUserId) {
    return NextResponse.json(
      { error: "Unauthorized: User ID not found in session." },
      { status: 401 }
    )
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
  const targetUrl = `${backendUrl}/api/v1/chat/ask`

  try {
    const payload = {
      page_id: pageId,
      user_id: effectiveUserId,
      conversation_id: body.conversation_id || null,
      user_query: body.user_query,
      page_content: body.page_content,
      model: body.model || "gemini-2.5-flash",
    }

    const res = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    })

    if (!res.ok) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }))
      return NextResponse.json(
        { error: errorBody.detail || `Chat backend returned error ${res.status}` },
        { status: res.status }
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to communicate with chat backend"
    return NextResponse.json(
      { error: `Could not connect to backend server: ${errorMsg}` },
      { status: 502 }
    )
  }
}
