import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string; convId: string }> }
) {
  const { convId } = await context.params
  const session = await auth()

  if (!session?.userId && !session?.user?.id) {
    // If testing in dev, allow if session or check header
  }

  const backendUrl = process.env.BACKEND_URL || "http://localhost:8000"
  const targetUrl = `${backendUrl}/api/v1/chat/conversations/${encodeURIComponent(convId)}`

  try {
    const res = await fetch(targetUrl, {
      method: "DELETE",
      cache: "no-store",
    })

    if (!res.ok && res.status !== 204) {
      const errorBody = await res.json().catch(() => ({ detail: res.statusText }))
      return NextResponse.json(
        { error: errorBody.detail || `Backend returned error ${res.status}` },
        { status: res.status }
      )
    }

    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Failed to delete conversation"
    return NextResponse.json(
      { error: `Could not connect to backend server: ${errorMsg}` },
      { status: 502 }
    )
  }
}
