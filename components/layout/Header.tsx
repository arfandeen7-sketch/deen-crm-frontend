"use client";

import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/layout/NotificationCenter";

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 bg-transparent px-4 sm:px-6 lg:px-8 py-6 border-none shadow-none">
      {/* Mobile Menu Button */}
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden transition-colors bg-white border border-zinc-200 shadow-sm"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Welcome Back (Desktop) */}
      <div className="hidden flex-col lg:flex font-secondary">
        <span className="text-sm font-medium text-zinc-400">Welcome Back,</span>
        <span className="text-3xl font-bold text-zinc-900 tracking-tight mt-0.5">
          {user?.fullName ?? "User"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <NotificationCenter />
      </div>
    </header>
  );
}
