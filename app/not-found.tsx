import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
      <p className="text-6xl font-bold text-gray-900">404</p>
      <h1 className="text-xl font-semibold text-slate-900">Page not found</h1>
      <p className="max-w-sm text-sm text-slate-500">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard/overview"
        className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
