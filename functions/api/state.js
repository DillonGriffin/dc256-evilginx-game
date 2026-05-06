import { finalFlag } from "../_lib/accounts.js";
import { gameSecret, json, requireDb } from "../_lib/http.js";
import { getGameState } from "../_lib/state.js";

export async function onRequestGet({ env }) {
  const db = requireDb(env);
  const secret = gameSecret(env);
  return json(await getGameState(db, await finalFlag(secret)));
}
