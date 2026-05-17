type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

const fallbackBaseUrl = "/api";

export function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || fallbackBaseUrl).replace(/\/$/, "");
}

export async function apiJson<T>(
  path: string,
  init: RequestInit = {}
): Promise<ApiResult<T>> {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      ...init,
      headers
    });
    const text = await response.text();
    let data: unknown = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: text.slice(0, 240) };
      }
    }
    if (!response.ok) {
      const errorPayload = data as { detail?: string; message?: string } | null;
      return {
        ok: false,
        status: response.status,
        error:
          errorPayload?.detail ||
          errorPayload?.message ||
          `API request failed (${response.status})`
      };
    }
    return { ok: true, status: response.status, data: data as T };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "API connection failed"
    };
  }
}
