"use client";

import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { PermissionProvider } from "@/contexts/PermissionContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <PermissionProvider>
        {children}
        <Toaster richColors position="top-right" closeButton />
      </PermissionProvider>
    </QueryProvider>
  );
}
