import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Detect if running inside Capacitor native shell (iOS / Android)
// In that context window.location.href starts with "capacitor://"
const isCapacitor =
  typeof window !== "undefined" &&
  (window.location.href.startsWith("capacitor://") ||
    window.location.href.startsWith("ionic://") ||
    // Also check for the Capacitor global object injected by the native runtime
    !!(window as unknown as Record<string, unknown>)["Capacitor"]);

// Production API base URL — used when running as a native Capacitor app
const PRODUCTION_API = "https://www.perplexity.ai/computer/a/muze-music-app-v1ZNbSQrSzyIEeRC2nXzWw";

// When running in Capacitor, we must use the absolute production URL because
// there is no local server — the web assets are bundled inside the native app.
// When running on web (dev or deployed), use the __PORT_5000__ proxy pattern.
const API_BASE = isCapacitor
  ? PRODUCTION_API
  : "__PORT_5000__".startsWith("__")
  ? ""
  : "__PORT_5000__";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await fetch(`${API_BASE}${url}`, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(`${API_BASE}${queryKey.join("/")}`);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
