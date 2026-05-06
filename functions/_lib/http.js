export function json(data, init = {}) {
  return new Response(JSON.stringify(data, null, 2), {
    ...init,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export function html(body, init = {}) {
  return new Response(body, {
    ...init,
    headers: {
      "content-type": "text/html; charset=utf-8",
      ...(init.headers || {})
    }
  });
}

export async function readJson(request) {
  const contentType = request.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return request.json();
  }

  const form = await request.formData();
  return Object.fromEntries(form.entries());
}

export function requireDb(env) {
  if (!env.GAME_DB) {
    throw new Error("Missing GAME_DB D1 binding.");
  }
  return env.GAME_DB;
}

export function gameSecret(env) {
  return env.GAME_SECRET || "change-this-before-your-workshop";
}

export function nowIso() {
  return new Date().toISOString();
}

export function randomId(prefix) {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const token = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}_${token}`;
}
