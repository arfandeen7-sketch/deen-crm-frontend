"use client";

import { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { TodoReminderPopup } from "./TodoReminderPopup";
import { useAuth } from "@/hooks/useAuth";
import { useInactivityTimer } from "@/hooks/useInactivityTimer";
import { InactivityModal } from "@/components/shared/InactivityModal";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [inactivityModalOpen, setInactivityModalOpen] = useState(false);

  const { isAuthenticated, logout } = useAuth();

  // Show the inactivity popup after 30 minutes of no activity.
  const handleTimeout = useCallback(() => {
    setInactivityModalOpen(true);
  }, []);

  const { resetTimer } = useInactivityTimer(handleTimeout, isAuthenticated);

  // "Stay" — close the modal and restart the 30-minute clock.
  const handleStay = useCallback(() => {
    setInactivityModalOpen(false);
    resetTimer();
  }, [resetTimer]);

  // "Leave" — close the modal and log the user out via the normal logout path.
  const handleLeave = useCallback(() => {
    setInactivityModalOpen(false);
    logout();
  }, [logout]);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="fixed inset-y-0 w-64">
          <Sidebar />
        </div>
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          "fixed inset-0 z-40 lg:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-zinc-950/80 backdrop-blur-sm transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 w-64 transition-transform duration-200",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenSidebar={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Inactivity warning — rendered via portal above all other content */}
      <InactivityModal
        open={inactivityModalOpen}
        onStay={handleStay}
        onLeave={handleLeave}
      />

      {/* At-time task reminder popup — shown only to the todo owner */}
      <TodoReminderPopup />
    </div>
  );
}
