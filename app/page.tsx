import { redirect } from "next/navigation";

export default function Home() {
  // Authenticated users land on the dashboard; the (dashboard) layout's
  // ProtectedRoute bounces unauthenticated users to /login.
  redirect("/dashboard/overview");
}
