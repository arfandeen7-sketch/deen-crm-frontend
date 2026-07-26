"use client";

import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/layout/NotificationCenter";

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 bg-transparent px-4 sm:px-6 lg:px-8 py-5 border-b border-neutral-200/50">
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 lg:hidden transition-colors bg-white border border-neutral-200 shadow-2xs cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Welcome Back (Desktop) */}
      <div className="hidden flex-col lg:flex">
        <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">Welcome Back,</span>
        <span className="text-2xl font-bold tracking-tight text-neutral-900 mt-0.5">
          {user?.fullName ?? "User"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <NotificationCenter />
      </div>
    </header>
  );
}
