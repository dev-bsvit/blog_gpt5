"use client";
import { SWRConfig } from "swr";
import { apiGet } from "@/lib/api";

export default function SWRProvider({ children }: { children: React.ReactNode }) {
  return (
    <SWRConfig
      value={{
        fetcher: (key: string): Promise<unknown> => apiGet<unknown>(key),
        revalidateOnFocus: false,
      }}
    >
      {children}
    </SWRConfig>
  );
}


