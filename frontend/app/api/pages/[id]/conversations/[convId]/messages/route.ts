import { NextRequest, NextResponse } from "next/server"

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string; convId: string }> }
) {
  const { convId } = await context.params

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
  const targetUrl = `${backendUrl}/api/v1/chat/conversations/${encodeURIComponent(convId)}/messages`

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
    const errorMsg = err instanceof Error ? err.message : "Failed to load conversation messages"
    return NextResponse.json(
      { error: `Could not connect to backend server: ${errorMsg}` },
      { status: 502 }
    )
  }
}
