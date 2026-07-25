"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
            retry: 1,
          },
        },
      }),
  );

  // Listen for 403-driven cancel-all events from the API client.
  useEffect(() => {
    const handler = () => {
      client.cancelQueries();
    };
    window.addEventListener("query:cancel-all", handler);
    return () => window.removeEventListener("query:cancel-all", handler);
  }, [client]);

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
