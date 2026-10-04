import { redirect } from "next/navigation"

// The middleware already redirects / → /pages, but this is a safety net
// in case the middleware matcher misses this route.
export default function RootPage() {
  redirect("/pages")
}
