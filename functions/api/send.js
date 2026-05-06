import { getAccount, credentialFor, getServiceByHostname, hashValue } from "../_lib/accounts.js";
import { gameSecret, json, nowIso, randomId, readJson, requireDb } from "../_lib/http.js";

function allowedHosts(env) {
  return (env.ALLOWED_LURE_HOSTS || "")
    .split(",")
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean);
}

function parseLureUrl(value) {
  try {
    const url = new URL(value);
    if (!["https:", "http:"].includes(url.protocol)) return null;
    return url;
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  const secret = gameSecret(env);
  const body = await readJson(request);
  const account = getAccount(String(body.accountId || ""));
  const participant = String(body.participant || "anonymous").slice(0, 80);
  const lureUrl = String(body.lureUrl || "").trim();
  const parsed = parseLureUrl(lureUrl);
  const hosts = allowedHosts(env);

  if (!account) {
    return json({ ok: false, error: "Unknown fake employee." }, { status: 400 });
  }
  if (!parsed) {
    return json({ ok: false, error: "Paste a complete http or https lure URL." }, { status: 400 });
  }
  if (hosts.length === 0) {
    return json({ ok: false, error: "Server is missing ALLOWED_LURE_HOSTS." }, { status: 500 });
  }
  if (!hosts.includes(parsed.hostname.toLowerCase())) {
    return json({ ok: false, error: `This lure host is not in the lab allowlist: ${parsed.hostname}` }, { status: 400 });
  }
  const service = getServiceByHostname(parsed.hostname);
  if (!service) {
    return json({ ok: false, error: `No fake service is mapped to ${parsed.hostname}. Use a dc256.lab lure hostname from the OSINT page.` }, { status: 400 });
  }
  if (!account.likelyServices.includes(service.id)) {
    return json({
      ok: false,
      error: `${account.name} is unlikely to open ${service.name}. Pick a service from that employee's OSINT profile.`
    }, { status: 400 });
  }

  const lureHash = await hashValue(lureUrl, secret);
  const existing = await db.prepare("SELECT account_id, status FROM used_lures WHERE lure_hash = ?").bind(lureHash).first();
  if (existing) {
    return json({
      ok: false,
      error: existing.account_id === account.id
        ? "Replay detected. That delivery link has already been used for this employee."
        : "Recipient mismatch. That delivery link is already bound to a different employee."
    }, { status: 409 });
  }

  const alreadySolved = await db.prepare("SELECT account_id FROM solved_flags WHERE account_id = ?").bind(account.id).first();
  if (alreadySolved) {
    return json({ ok: false, error: "That employee has already been completed on the Breach Map." }, { status: 409 });
  }

  const sendId = randomId("send");
  await db.prepare(
    "INSERT INTO used_lures (id, lure_hash, lure_url, lure_host, service_id, account_id, participant, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'sent', ?)"
  ).bind(sendId, lureHash, lureUrl, parsed.hostname.toLowerCase(), service.id, account.id, participant, nowIso()).run();

  await db.prepare(
    "INSERT INTO game_events (event_type, account_id, participant, detail, created_at) VALUES ('mail_sent', ?, ?, ?, ?)"
  ).bind(account.id, participant, parsed.hostname.toLowerCase(), nowIso()).run();

  const password = await credentialFor(account, secret);
  return json({
    ok: true,
    sendId,
    victimUrl: `/victim.html?send=${encodeURIComponent(sendId)}`,
    delivery: {
      account: account.email,
      service: service.name,
      status: "accepted",
      note: "One-time delivery created. The service matches this employee's OSINT profile."
    },
    preview: {
      username: account.email,
      passwordHint: `${password.slice(0, 8)}...`
    }
  });
}
