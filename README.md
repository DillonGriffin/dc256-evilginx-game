# DC256 Victim Game

This is a standalone, synthetic victim portal and shared workshop game for a closed security training event.

It is designed for Cloudflare Pages + Pages Functions + D1 so every participant plays the same online game without requiring paid hosting or a local network target.

## What This App Does

- Hosts a fake employee portal at `/login.html`.
- Provides 150 synthetic fake employees.
- Generates deterministic synthetic passwords and flags server-side.
- Provides a fake mail console at `/mail.html`.
- Provides an OSINT desk at `/osint.html`.
- Enforces one-time lure link usage.
- Allows only configured `dc256.lab` lure hostnames.
- Rejects lures for services that do not match the selected employee's OSINT profile.
- Provides a simulated recipient page at `/victim.html`.
- Posts synthetic credentials through the allowlisted lab lure host.
- Provides a shared Breach Map game board at `/`.
- Provides flag submission at `/submit.html`.

No real credentials are used. No real employee data is used. The submitted lure URL must match your configured allowlist.

## Game: Breach Map

The game is a shared incident-response board.

Each fake account is a network node. When a participant captures synthetic credentials through the lab flow, they use those credentials on the fake portal. The portal returns a per-account flag. Submitting that flag unlocks the node globally.

Departments:

- HR
- Finance
- Engineering
- Operations
- Legal
- IT
- Security
- Executive

Department keys are earned when 35% of a department's nodes are unlocked. Six department keys unlock the final incident report flag.

The final flag format is:

```text
DC256{7h15_15_4_FL4G_<server-derived-suffix>}
```

The suffix depends on `GAME_SECRET`, so change that value before the workshop.

## Participant Flow

1. Open `/osint.html`.
2. Pick a fake employee and note their likely services.
3. Select the matching lab phishlet for that service.
4. Generate a fresh lure using that phishlet.
5. Open `/mail.html`.
6. Enter a team name.
7. Select the fake employee.
8. Paste the fresh `dc256.lab` lure link.
9. Send the fake message.
10. Click `Open Simulated Victim`.
11. The simulated recipient opens the lure and posts that employee's synthetic credentials through the lure host.
12. Retrieve the synthetic credentials from your lab capture view.
13. Open `/login.html`.
14. Log in with the captured credentials.
15. Copy the returned flag.
16. Open `/submit.html`.
17. Submit the flag to unlock a Breach Map node.

## Why A Fresh Link Is Required

The in-game rule is:

> The mail gateway fingerprints every delivery link. Reused, forwarded, or mismatched links are rejected as replayed mail.

The server enforces:

- A lure URL can be used once.
- A lure URL is bound to the selected recipient.
- The lure service must match one of the recipient's OSINT services.
- Reusing the same lure URL returns a replay error.
- Using the same lure URL for another recipient returns a recipient mismatch error.
- Using the wrong service returns an unlikely-service error.
- Completed employee nodes cannot be completed again.

## OSINT Services

The app defines twelve synthetic services. Each service maps to one `dc256.lab` lure hostname.

```text
Acme Payroll   -> payroll-login.dc256.lab
LedgerCloud    -> ledger-login.dc256.lab
TravelDesk     -> travel-login.dc256.lab
GitForge       -> git-login.dc256.lab
BuildHive      -> build-login.dc256.lab
TicketNest     -> tickets-login.dc256.lab
PeoplePortal   -> people-login.dc256.lab
BenefitsBox    -> benefits-login.dc256.lab
LearnLoop      -> learn-login.dc256.lab
HelpDeskPro    -> helpdesk-login.dc256.lab
DeviceVault    -> devices-login.dc256.lab
CloudConsole   -> cloud-login.dc256.lab
```

## Local Development

Install Node.js 20 or newer.

```bash
npm install
npm run db:init
npm run dev
```

Wrangler will start a local Pages dev server. The local D1 database lives under `.wrangler/`.

`npm run dev` reads the D1 binding from `wrangler.toml`. After you create the D1 database, replace the placeholder `database_id` before relying on Wrangler local development.

For local testing, create `.dev.vars`:

```text
GAME_SECRET="replace-with-a-long-random-workshop-secret"
ALLOWED_LURE_HOSTS="payroll-login.dc256.lab,ledger-login.dc256.lab,travel-login.dc256.lab,git-login.dc256.lab,build-login.dc256.lab,tickets-login.dc256.lab,people-login.dc256.lab,benefits-login.dc256.lab,learn-login.dc256.lab,helpdesk-login.dc256.lab,devices-login.dc256.lab,cloud-login.dc256.lab"
```

Open the local URL Wrangler prints.

## Cloudflare Setup

### 1. Create A GitHub Repository

Create a new repository for this folder, for example:

```text
dc256-victim-game
```

Push this app as the repo root.

### 2. Create A Cloudflare D1 Database

From the repo directory:

```bash
npx wrangler login
npx wrangler d1 create dc256-victim-game
```

Cloudflare prints a `database_id`. Put that value into `wrangler.toml`:

```toml
[[d1_databases]]
binding = "GAME_DB"
database_name = "dc256-victim-game"
database_id = "the-id-cloudflare-printed"
```

Initialize the remote database:

```bash
npm run db:init:remote
```

If you already created the database from an earlier version of this app, add the service column:

```bash
npx wrangler d1 execute dc256-victim-game --remote --file=./migrations/002_add_service_id.sql
```

### 3. Create The Cloudflare Pages Project

In the Cloudflare dashboard:

1. Go to `Workers & Pages`.
2. Click `Create`.
3. Choose `Pages`.
4. Connect your GitHub repo.
5. Set the build command to empty or:

```text
npm install
```

6. Set the build output directory:

```text
public
```

7. Deploy.

Cloudflare will detect the `functions/` directory and deploy the Pages Functions with the static site.

### 4. Bind D1 To Pages

In the Pages project:

1. Go to `Settings`.
2. Go to `Functions`.
3. Add a D1 database binding.
4. Binding name:

```text
GAME_DB
```

5. Select the `dc256-victim-game` database.

### 5. Add Environment Variables

In the Pages project:

1. Go to `Settings`.
2. Go to `Environment variables`.
3. Add:

```text
GAME_SECRET=<long-random-secret>
ALLOWED_LURE_HOSTS=<comma-separated-lure-hosts>
```

Example:

```text
GAME_SECRET=dc256-2026-change-this-to-a-long-random-value
ALLOWED_LURE_HOSTS=payroll-login.dc256.lab,ledger-login.dc256.lab,travel-login.dc256.lab,git-login.dc256.lab,build-login.dc256.lab,tickets-login.dc256.lab,people-login.dc256.lab,benefits-login.dc256.lab,learn-login.dc256.lab,helpdesk-login.dc256.lab,devices-login.dc256.lab,cloud-login.dc256.lab
```

`ALLOWED_LURE_HOSTS` must contain the hostnames participants paste into the mail console. The app rejects any lure URL whose hostname is not listed.

After adding variables, redeploy the Pages project.

## Evilginx Lab Target Notes

This app is the fake target site. Your lab lure should proxy the deployed Cloudflare Pages hostname or your custom domain for this app.

The included phishlet templates are in the Evilginx repo next to this folder:

```text
phishlets/dc256_acme_payroll.yaml
phishlets/dc256_ledgercloud.yaml
phishlets/dc256_traveldesk.yaml
phishlets/dc256_gitforge.yaml
phishlets/dc256_buildhive.yaml
phishlets/dc256_ticketnest.yaml
phishlets/dc256_peopleportal.yaml
phishlets/dc256_benefitsbox.yaml
phishlets/dc256_learnloop.yaml
phishlets/dc256_helpdeskpro.yaml
phishlets/dc256_devicevault.yaml
phishlets/dc256_cloudconsole.yaml
```

Those files use this placeholder upstream:

```text
dc256-victim-game.pages.dev
```

Replace that hostname in every `dc256_*.yaml` phishlet with your actual Cloudflare Pages hostname after deployment.

The target login endpoint is:

```text
POST /api/login
```

The form fields are:

```text
email
username
password
mode
```

For the simulated recipient flow, `mode` is `victim`. For participant login on `/login.html`, `mode` is `participant`.

Your lab capture configuration should look for the synthetic username/email field and the `password` field. The app intentionally uses ordinary form fields so the fake target is easy to reason about during the workshop.

## Custom Domains

Recommended hostnames:

```text
dc256-victim-game.pages.dev   -> Cloudflare Pages victim game
*-login.dc256.lab             -> Evilginx lure/proxy hostnames
```

Participants paste service-specific lure URLs into `/mail.html`, for example:

```text
https://payroll-login.dc256.lab/...
https://git-login.dc256.lab/...
https://helpdesk-login.dc256.lab/...
```

The simulated victim page loads that lure, then posts credentials to:

```text
https://payroll-login.dc256.lab/api/login
```

The proxied request should reach:

```text
https://dc256-victim-game.pages.dev/api/login
```

## Hosts File Entries

If Evilginx is running on each participant laptop:

```text
127.0.0.1 payroll-login.dc256.lab
127.0.0.1 ledger-login.dc256.lab
127.0.0.1 travel-login.dc256.lab
127.0.0.1 git-login.dc256.lab
127.0.0.1 build-login.dc256.lab
127.0.0.1 tickets-login.dc256.lab
127.0.0.1 people-login.dc256.lab
127.0.0.1 benefits-login.dc256.lab
127.0.0.1 learn-login.dc256.lab
127.0.0.1 helpdesk-login.dc256.lab
127.0.0.1 devices-login.dc256.lab
127.0.0.1 cloud-login.dc256.lab
```

If Evilginx is running on a shared lab VM, replace `127.0.0.1` with that VM's IP address.

Hosts files do not support wildcards. Use explicit entries or provide participants a small DNS resolver for `dc256.lab`.

Each participant browser must also trust the Evilginx developer-mode lab CA, or HTTPS will fail for the fake `dc256.lab` lure hosts.

## Resetting The Game

To clear the remote game state:

```bash
npx wrangler d1 execute dc256-victim-game --remote --command "DELETE FROM used_lures; DELETE FROM solved_flags; DELETE FROM game_events;"
```

To clear only local state:

```bash
npx wrangler d1 execute dc256-victim-game --local --command "DELETE FROM used_lures; DELETE FROM solved_flags; DELETE FROM game_events;"
```

## Operational Checklist

Before the workshop:

- Set `GAME_SECRET`.
- Set `ALLOWED_LURE_HOSTS`.
- Replace `dc256-victim-game.pages.dev` in the phishlet templates with your deployed Pages hostname.
- Add the `dc256.lab` hosts entries on participant machines.
- Trust the Evilginx developer-mode lab CA on participant machines.
- Initialize D1 with `schema.sql`.
- Test `/api/state`.
- Test `/osint.html` and confirm each employee shows likely services.
- Test `/mail.html` with a matching `dc256.lab` lure hostname.
- Confirm a wrong-service lure is rejected.
- Confirm replayed lure URLs are rejected.
- Confirm the simulated recipient posts to the lure host.
- Confirm synthetic credentials appear in the lab capture view.
- Confirm `/login.html` returns a flag for captured synthetic credentials.
- Confirm `/submit.html` unlocks a node.
- Confirm the board updates for a second browser.

## Safety Boundaries

This app is intentionally constrained:

- It only generates synthetic credentials.
- It only accepts allowlisted lure hostnames.
- It does not store real credentials.
- It does not scrape pages.
- It does not bypass authentication.
- It does not attempt to evade detection.
- It is intended for a closed, authorized workshop.

Do not add broad arbitrary-URL support. Keep `ALLOWED_LURE_HOSTS` scoped to domains you control for the lab.
