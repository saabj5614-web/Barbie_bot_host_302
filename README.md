# Barbie Reseller Panel V1

Fresh Vercel control panel for an authorized Pterodactyl installation.

## Included
- Owner password gate before any management endpoint is usable.
- Pterodactyl Application API server-side adapter.
- Hidden upstream URL/key: they are never sent to browser code.
- Five reserved owner boards:
  1. Barbie Bot
  2. Telegram Bot 1
  3. Telegram Bot 2
  4. Mini Bot
  5. Panel Hosting Bot
- Reseller provisioning endpoint: creates a Pterodactyl user + server after owner authentication.
- Server list/start/stop/restart endpoints.
- Resource values are configurable; the panel never claims that 0/unlimited creates physical RAM.
- Customer domain generation is a logical identifier. Actual wildcard DNS/reverse-proxy routing must be configured for the domain to resolve.

## Important
This project does not include or request leaked credentials. Put your own Pterodactyl Application API key in Vercel Environment Variables.

For production customer accounts, add a real database/session store before selling access at scale. The V1 owner gate is deliberately simple and should not be treated as a complete billing/identity system.
