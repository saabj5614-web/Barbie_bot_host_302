# 𝐁𝐀𝐑𝐁𝐈𝐄 Hosting Panel

Personal owner-only hosting control panel with **4 fixed server slots**.

## Current panel design

- Exactly 4 server slots; no reseller/customer provisioning flow.
- No per-slot hard CPU percentage in the panel design. The compute backend can share available CPU between workloads.
- No 50 GB hard disk reservation in the panel UI; actual capacity is supplied by the backend.
- Separate management view for every configured slot.
- Start / Stop / Restart / Kill.
- Resource monitoring.
- File listing and file reading.
- Owner authentication with an HTTP-only signed session cookie.
- GitHub public/private repository inspection and deployment flow.
- Secrets stay server-side.

## Fixed slot mapping

Set these environment variables when a backend is connected:

`SLOT_1_SERVER_ID`
`SLOT_2_SERVER_ID`
`SLOT_3_SERVER_ID`
`SLOT_4_SERVER_ID`

## Next integration stage

The current repository contains the fixed-slot control layer. The next stage replaces the temporary Pterodactyl transport with Oracle Cloud Compute, then adds Oracle-backed console, file operations, uploads/downloads, archives, backups and provisioning.

**Important:** Vercel is the control/API layer; long-running bot processes should run on the compute backend, not inside a Vercel request.

## Deployment

Deploy this repository to Vercel and configure the owner authentication variables plus the backend variables required by the current stage.
