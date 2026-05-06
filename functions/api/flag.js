import { finalFlag, flagFor, getAccounts, hashValue } from "../_lib/accounts.js";
import { gameSecret, json, nowIso, readJson, requireDb } from "../_lib/http.js";
import { getGameState } from "../_lib/state.js";

export async function onRequestPost({ request, env }) {
  const db = requireDb(env);
  const secret = gameSecret(env);
  const body = await readJson(request);
  const submittedFlag = String(body.flag || "").trim();
  const participant = String(body.participant || "anonymous").slice(0, 80);

  if (!submittedFlag) {
    return json({ ok: false, error: "Enter a flag." }, { status: 400 });
  }

  let matched = null;
  for (const account of getAccounts()) {
    if (submittedFlag === await flagFor(account, secret)) {
      matched = account;
      break;
    }
  }

  if (!matched) {
    if (submittedFlag === await finalFlag(secret)) {
      return json({ ok: true, final: true, message: "Final incident report accepted. Breach Map complete." });
    }
    return json({ ok: false, error: "That flag is not valid for this workshop." }, { status: 400 });
  }

  const flagHash = await hashValue(submittedFlag, secret);
  const existing = await db.prepare("SELECT account_id FROM solved_flags WHERE account_id = ?").bind(matched.id).first();
  if (existing) {
    return json({ ok: false, error: "That employee node was already unlocked." }, { status: 409 });
  }

  await db.prepare(
    "INSERT INTO solved_flags (flag_hash, account_id, participant, points, submitted_at) VALUES (?, ?, ?, ?, ?)"
  ).bind(flagHash, matched.id, participant, matched.points, nowIso()).run();

  await db.prepare(
    "INSERT INTO game_events (event_type, account_id, participant, detail, created_at) VALUES ('flag_solved', ?, ?, ?, ?)"
  ).bind(matched.id, participant, matched.department, nowIso()).run();

  const state = await getGameState(db, await finalFlag(secret));
  return json({
    ok: true,
    account: {
      id: matched.id,
      email: matched.email,
      name: matched.name,
      department: matched.department,
      tier: matched.tier,
      points: matched.points
    },
    state,
    message: `${matched.department} node unlocked.`
  });
}
