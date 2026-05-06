import { getAccounts, publicAccount } from "../_lib/accounts.js";
import { json } from "../_lib/http.js";

export async function onRequestGet() {
  return json({ accounts: getAccounts().map(publicAccount) });
}
