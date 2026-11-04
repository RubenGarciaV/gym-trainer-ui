import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";

const hopByHopHeaders = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "host",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export const config = {
  api: {
    bodyParser: false,
  },
};

const sendError = (response, status, code, message) => {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify({ error: { code, message } }));
};

export default async function handler(request, response) {
  const configuredOrigin = process.env.VITE_API_URL;
  if (!configuredOrigin) {
    console.error("VITE_API_URL is required for the API proxy.");
    sendError(
      response,
      500,
      "API_PROXY_MISCONFIGURED",
      "El API no está configurado.",
    );
    return;
  }

  let apiOrigin;
  try {
    apiOrigin = new URL(configuredOrigin);
  } catch {
    console.error("VITE_API_URL must be a valid API origin.");
    sendError(
      response,
      500,
      "API_PROXY_MISCONFIGURED",
      "El API no está configurado correctamente.",
    );
    return;
  }

  if (
    !["http:", "https:"].includes(apiOrigin.protocol) ||
    apiOrigin.username ||
    apiOrigin.password ||
    apiOrigin.pathname !== "/" ||
    apiOrigin.search ||
    apiOrigin.hash
  ) {
    console.error("VITE_API_URL must contain only an HTTP(S) API origin.");
    sendError(
      response,
      500,
      "API_PROXY_MISCONFIGURED",
      "El API no está configurado correctamente.",
    );
    return;
  }

  let targetUrl;
  try {
    targetUrl = new URL(request.url || "/api", apiOrigin);
  } catch {
    sendError(response, 400, "INVALID_API_PATH", "La ruta del API no es válida.");
    return;
  }

  if (
    targetUrl.origin !== apiOrigin.origin ||
    (targetUrl.pathname !== "/api" && !targetUrl.pathname.startsWith("/api/"))
  ) {
    sendError(response, 400, "INVALID_API_PATH", "La ruta del API no es válida.");
    return;
  }

  const headers = new Headers();
  for (const [name, value] of Object.entries(request.headers)) {
    if (value === undefined || hopByHopHeaders.has(name.toLowerCase())) continue;
    headers.set(
      name,
      Array.isArray(value)
        ? value.join(name.toLowerCase() === "cookie" ? "; " : ", ")
        : value,
    );
  }

  const method = request.method || "GET";
  const hasBody = method !== "GET" && method !== "HEAD";

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method,
      headers,
      ...(hasBody ? { body: request, duplex: "half" } : {}),
      redirect: "manual",
    });

    response.statusCode = upstreamResponse.status;
    upstreamResponse.headers.forEach((value, name) => {
      if (name !== "set-cookie" && !hopByHopHeaders.has(name.toLowerCase())) {
        response.setHeader(name, value);
      }
    });

    const setCookies =
      typeof upstreamResponse.headers.getSetCookie === "function"
        ? upstreamResponse.headers.getSetCookie()
        : [upstreamResponse.headers.get("set-cookie")].filter(Boolean);
    if (setCookies.length > 0) response.setHeader("set-cookie", setCookies);

    if (!upstreamResponse.body) {
      response.end();
      return;
    }

    await pipeline(Readable.fromWeb(upstreamResponse.body), response);
  } catch (error) {
    console.error("API proxy request failed.", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    if (response.headersSent) {
      response.destroy(error instanceof Error ? error : undefined);
      return;
    }
    sendError(
      response,
      502,
      "API_PROXY_FAILED",
      "No se pudo conectar con el API.",
    );
  }
}
