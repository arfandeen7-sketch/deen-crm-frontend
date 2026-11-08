"use client";

import { Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NotificationCenter } from "@/components/layout/NotificationCenter";

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-10">
      <button
        onClick={onOpenSidebar}
        className="cursor-pointer rounded-lg p-2 text-ink transition-[background-color,transform] hover:bg-fill-soft active:scale-95 lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" strokeWidth={1.5} />
      </button>

      <div className="enter hidden flex-col lg:flex">
        <span className="text-[12.5px] text-ink-3">Welcome back</span>
        <span className="mt-0.5 text-[24px] font-normal leading-tight tracking-tight text-ink">
          {user?.fullName ?? "User"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <NotificationCenter />
      </div>
    </header>
  );
}
