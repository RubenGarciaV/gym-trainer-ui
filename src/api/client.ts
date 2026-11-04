const apiBaseUrl = import.meta.env.PROD
  ? ""
  : (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");
const isMockingAuth =
  import.meta.env.DEV && import.meta.env.VITE_API_MOCKING === "enabled";
const mockSessionStorageKey = "gym-trainer:mock-session";

interface MockSession {
  user: {
    id: string;
    name: string;
    email: string;
    emailVerified: boolean;
    image: string | null;
    createdAt: string;
    updatedAt: string;
  };
  password: string;
}

const isMockUser = (value: unknown): value is MockSession["user"] =>
  typeof value === "object" &&
  value !== null &&
  "id" in value &&
  typeof value.id === "string" &&
  "name" in value &&
  typeof value.name === "string" &&
  "email" in value &&
  typeof value.email === "string" &&
  "emailVerified" in value &&
  typeof value.emailVerified === "boolean" &&
  "image" in value &&
  (typeof value.image === "string" || value.image === null) &&
  "createdAt" in value &&
  typeof value.createdAt === "string" &&
  "updatedAt" in value &&
  typeof value.updatedAt === "string";

const readMockSession = (): MockSession | null => {
  if (!isMockingAuth) return null;

  const storedSession = localStorage.getItem(mockSessionStorageKey);
  if (!storedSession) return null;

  try {
    const session: unknown = JSON.parse(storedSession);
    if (
      typeof session === "object" &&
      session !== null &&
      "user" in session &&
      isMockUser(session.user) &&
      "password" in session &&
      typeof session.password === "string"
    ) {
      return session as MockSession;
    }
  } catch {
    localStorage.removeItem(mockSessionStorageKey);
  }

  return null;
};

const writeMockSession = (session: MockSession | null) => {
  if (!isMockingAuth) return;

  if (session) {
    localStorage.setItem(mockSessionStorageKey, JSON.stringify(session));
  } else {
    localStorage.removeItem(mockSessionStorageKey);
  }
};

const readJsonBody = (body: BodyInit | null | undefined): unknown => {
  if (typeof body !== "string") return null;

  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

const getErrorMessage = (payload: unknown): string | undefined => {
  if (typeof payload !== "object" || payload === null) {
    return undefined;
  }

  if ("message" in payload && typeof payload.message === "string") {
    return payload.message;
  }

  if (
    "error" in payload &&
    typeof payload.error === "object" &&
    payload.error !== null &&
    "message" in payload.error &&
    typeof payload.error.message === "string"
  ) {
    return payload.error.message;
  }

  return undefined;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  const mockSession = readMockSession();
  if (mockSession) {
    headers.set("X-Mock-Session", encodeURIComponent(JSON.stringify(mockSession)));
  }
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  const payload: unknown =
    response.status === 204 ? undefined : await response.json();

  if (!response.ok) {
    throw new Error(
      getErrorMessage(payload) ??
        `La solicitud ha fallado (código ${response.status}).`,
    );
  }

  if (isMockingAuth) {
    const requestBody = readJsonBody(init.body);
    const result =
      typeof payload === "object" && payload !== null && "user" in payload
        ? payload.user
        : undefined;

    if (
      (path === "/api/auth/sign-in/email" ||
        path === "/api/auth/sign-up/email") &&
      isMockUser(result)
    ) {
      const password =
        typeof requestBody === "object" &&
        requestBody !== null &&
        "password" in requestBody &&
        typeof requestBody.password === "string"
          ? requestBody.password
          : "";
      writeMockSession({ user: result, password });
    } else if (path === "/api/auth/update-user" && mockSession) {
      const updatedName =
        typeof requestBody === "object" &&
        requestBody !== null &&
        "name" in requestBody &&
        typeof requestBody.name === "string"
          ? requestBody.name
          : mockSession.user.name;
      writeMockSession({
        ...mockSession,
        user: { ...mockSession.user, name: updatedName },
      });
    } else if (path === "/api/auth/change-password" && mockSession) {
      const newPassword =
        typeof requestBody === "object" &&
        requestBody !== null &&
        "newPassword" in requestBody &&
        typeof requestBody.newPassword === "string"
          ? requestBody.newPassword
          : mockSession.password;
      writeMockSession({ ...mockSession, password: newPassword });
    } else if (path === "/api/auth/sign-out") {
      writeMockSession(null);
    }
  }

  return payload as T;
}

export const jsonRequest = (method: "POST" | "PATCH", body: unknown) => ({
  method,
  body: JSON.stringify(body),
});
