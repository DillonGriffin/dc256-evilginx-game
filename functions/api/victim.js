import { credentialFor, getAccount } from "../_lib/accounts.js";
import { gameSecret, json, nowIso, readJson, requireDb } from "../_lib/http.js";

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  const secret = gameSecret(env);
  const body = await readJson(request);
  const sendId = String(body.sendId || "");

  const send = await db.prepare("SELECT * FROM used_lures WHERE id = ?").bind(sendId).first();
  if (!send) {
    return json({ ok: false, error: "Unknown delivery record." }, { status: 404 });
  }
  if (send.opened_at) {
    return json({ ok: false, error: "Replay detected. This simulated recipient already opened that delivery." }, { status: 409 });
  }

  const account = getAccount(send.account_id);
  if (!account) {
    return json({ ok: false, error: "Delivery references an unknown employee." }, { status: 500 });
  }

  const lure = new URL(send.lure_url);
  const loginPostUrl = `${lure.origin}/api/login`;
  const password = await credentialFor(account, secret);

  await db.prepare("UPDATE used_lures SET status = 'opened', opened_at = ? WHERE id = ?")
    .bind(nowIso(), sendId)
    .run();

  await db.prepare(
    "INSERT INTO game_events (event_type, account_id, participant, detail, created_at) VALUES ('victim_opened', ?, ?, ?, ?)"
  ).bind(account.id, send.participant || "anonymous", send.lure_host, nowIso()).run();

  return json({
    ok: true,
    account: {
      id: account.id,
      email: account.email,
      name: account.name,
      department: account.department
    },
    credentials: {
      username: account.email,
      password
    },
    lureUrl: send.lure_url,
    loginPostUrl
  });
}
