import { credentialFor, flagFor, getAccounts, hashValue } from "../_lib/accounts.js";
import { gameSecret, html, json, nowIso, readJson, requireDb } from "../_lib/http.js";

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[char]));
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  const secret = gameSecret(env);
  const body = await readJson(request);
  const username = String(body.email || body.username || "").trim().toLowerCase();
  const password = String(body.password || "");
  const mode = String(body.mode || "participant");
  const participant = String(body.participant || "anonymous").slice(0, 80);
  const sendId = String(body.sendId || "");

  const account = getAccounts().find((candidate) => candidate.email.toLowerCase() === username);
  if (!account) {
    return json({ ok: false, error: "Invalid username or password." }, { status: 401 });
  }

  const expected = await credentialFor(account, secret);
  if (password !== expected) {
    return json({ ok: false, error: "Invalid username or password." }, { status: 401 });
  }

  await db.prepare(
    "INSERT INTO game_events (event_type, account_id, participant, detail, created_at) VALUES ('login_success', ?, ?, ?, ?)"
  ).bind(account.id, participant, mode, nowIso()).run();

  if (mode === "victim") {
    if (sendId) {
      await db.prepare("UPDATE used_lures SET status = 'captured', captured_at = ? WHERE id = ? AND account_id = ?")
        .bind(nowIso(), sendId, account.id)
        .run();
    }
    return html(`<!doctype html><title>Signed in</title><p>Mailbox session established for ${escapeHtml(account.email)}.</p>`);
  }

  const flag = await flagFor(account, secret);
  const flagHash = await hashValue(flag, secret);
  return json({
    ok: true,
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      department: account.department,
      tier: account.tier,
      points: account.points
    },
    flag,
    flagHash,
    message: "Credential accepted. Submit this flag on the Breach Map."
  });
}
