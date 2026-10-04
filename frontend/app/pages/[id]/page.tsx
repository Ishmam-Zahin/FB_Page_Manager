import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { DashboardClient } from "./DashboardClient"

export const metadata: Metadata = {
  title: "Page Dashboard — Facebook Analytics & AI Insights",
  description: "Comprehensive Facebook Page analytics, engagement telemetry, and Gemini AI strategic insights.",
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PageDashboard({ params }: PageProps) {
  const session = await auth()
  const { id } = await params

  // Protect route
  if (!session) {
    redirect("/login")
  }

  return <DashboardClient pageId={id} />
}
