"use client";

import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";
import { PermissionProvider } from "@/contexts/PermissionContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <PermissionProvider>
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            unstyled: false,
            style: {
              background: "#1a1a1a",
              color: "#ffffff",
              border: "1px solid #1a1a1a",
              borderRadius: "999px",
              padding: "12px 20px",
              fontSize: "13px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            },
          }}
        />
      </PermissionProvider>
    </QueryProvider>
  );
}
