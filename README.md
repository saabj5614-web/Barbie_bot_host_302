# Barbie Reseller Panel V1

Premium Vercel control panel for an authorized Pterodactyl installation.

## Included
- Owner password gate before management endpoints are usable.
- Pterodactyl Application API server-side adapter.
- Optional Pterodactyl Client API for power, resources and file operations.
- Hidden upstream URL/key: credentials are never sent to browser code.
- Server isolation marker: only servers tagged as managed by this custom panel are exposed in its fleet.
- Reseller provisioning: creates a Pterodactyl user + panel-owned server after owner authentication.
- Server list/start/stop/restart/suspend/unsuspend/delete and management views.
- GitHub repository import/deploy for public and private repositories.
- Five reserved owner boards: Barbie Bot, Telegram Bot 1, Telegram Bot 2, Mini Bot, Panel Hosting Bot.
- Resource values are configurable; unlimited/zero Pterodactyl capacity is not presented as physical RAM.

## GitHub deployment
Public repositories can be imported without a GitHub credential. Private repositories cannot be read from a URL alone: configure a server-side `GITHUB_TOKEN` in Vercel. A fine-grained GitHub token with `Contents: Read` access to the selected repository is sufficient for repository archive access.

The deployment flow keeps the GitHub token server-side. It creates a short-lived signed import URL, queues the archive download to the selected Pterodactyl server through the Client API, then the server startup extracts the archive into `.barbie-app`, installs Node dependencies and runs the configured start command.

Required for deployment:
- `PTERO_APP_API_KEY`
- `PTERO_CLIENT_API_KEY`
- `GITHUB_TOKEN` only when private repositories are used

Never paste tokens into the browser UI or commit them to GitHub. Store them as Vercel Environment Variables.

## Isolation limitation
The custom panel can hide non-owned servers from its own UI by filtering the panel marker. It cannot make servers disappear from the underlying Pterodactyl administrator panel. If two frontends use the same Pterodactyl backend, the backend administrator can still see every server.

## Production note
For public resale, add a real database/session layer for customers, resellers, quotas, billing, audit logs and persistent notes. V1's owner gate is intentionally small and is not a full billing/identity system.
