
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:5000/api";

export function saveToken(token) {
  sessionStorage.setItem("nielit_token", token);
}

export function getToken() {
  return sessionStorage.getItem("nielit_token");
}

export function clearToken() {
  sessionStorage.removeItem("nielit_token");
}

export async function apiRequest(endpoint, options = {}) {
  const token = getToken();
  const isForm = options.body instanceof FormData;

  const headers = {
    ...(isForm ? {} : { "Content-Type": "application/json" }),
    ...options.headers
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 204) return null;

  const contentType = response.headers.get("content-type") || "";

  if (!response.ok) {
    const errorData = contentType.includes("application/json")
      ? await response.json().catch(() => ({}))
      : {};

    if (
      response.status === 401 &&
      !endpoint.startsWith("/auth/login")
    ) {
      clearToken();
      window.dispatchEvent(new Event("nielit:session-expired"));
    }

    throw new Error(
      errorData.error ||
      errorData.message ||
      `Request failed: ${response.status}`
    );
  }

  if (contentType.includes("application/pdf")) {
    return response.blob();
  }

  return response.json().catch(() => ({}));
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}

export default apiRequest;
