"use client";

import { Toaster } from "sonner";
import { QueryProvider } from "./query-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      {children}
      <Toaster richColors position="top-right" closeButton />
    </QueryProvider>
  );
}
