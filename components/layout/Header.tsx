"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, ChevronDown, LogOut, KeyRound, UserCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { UserAvatar } from "@/components/ui/Avatar";
import { NotificationCenter } from "@/components/layout/NotificationCenter";
import { ROLE_LABELS } from "@/constants";

export function Header({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 shadow-sm shadow-zinc-100">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 lg:hidden transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden text-sm text-zinc-500 lg:block">
        Welcome back,{" "}
        <span className="font-semibold text-zinc-900">{user?.fullName ?? "User"}</span>
      </div>

      <div className="ml-auto flex items-center gap-1">
        <NotificationCenter />

        <div ref={ref}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2.5 rounded-lg p-1 pr-2 hover:bg-zinc-50 transition-colors border border-transparent hover:border-zinc-200"
          >
            <UserAvatar name={user?.fullName} />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-semibold text-zinc-900">{user?.fullName}</p>
              <p className="text-xs font-medium text-amber-600">
                {user ? ROLE_LABELS[user.role] : ""}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-zinc-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-4 mt-2 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg shadow-zinc-200/50">
              <div className="border-b border-zinc-100 px-4 py-3">
                <p className="text-sm font-semibold text-zinc-900">{user?.fullName}</p>
                <p className="truncate text-xs font-medium text-amber-600">{user?.email}</p>
              </div>
              <Link
                href="/settings/profile"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <UserCircle className="h-4 w-4 text-zinc-400" /> Profile
              </Link>
              <Link
                href="/settings/change-password"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition-colors"
              >
                <KeyRound className="h-4 w-4 text-zinc-400" /> Change Password
              </Link>
              <button
                onClick={logout}
                className="flex w-full items-center gap-2.5 border-t border-zinc-100 px-4 py-2.5 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
