type ApiResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: string };

const fallbackBaseUrl = "/api";

function friendlyApiError(status: number, message: string) {
  const normalized = message.trim();
  if (
    status >= 500 ||
    normalized.toLowerCase() === "internal server error" ||
    normalized.toLowerCase().includes("failed to fetch")
  ) {
    return "서버 저장소 연결을 확인하는 중입니다. 배포 스크립트가 데이터베이스 설정과 마이그레이션을 완료했는지 확인한 뒤 다시 시도해 주세요.";
  }
  return normalized || `API 요청에 실패했습니다. (${status})`;
}

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
      const rawError =
        errorPayload?.detail ||
        errorPayload?.message ||
        `API request failed (${response.status})`;
      return {
        ok: false,
        status: response.status,
        error: friendlyApiError(response.status, rawError)
      };
    }
    return { ok: true, status: response.status, data: data as T };
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: friendlyApiError(0, error instanceof Error ? error.message : "API connection failed")
    };
  }
}
