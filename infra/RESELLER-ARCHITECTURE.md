# Reseller architecture

Custom panel (Vercel) -> server-side Pterodactyl Application API -> Pterodactyl Panel -> Wings/Node -> Docker server.

The Application API can manage authorized Pterodactyl resources. The underlying node(s) still determine real CPU/RAM. A value such as 0/unlimited is not physical unlimited RAM.

For a production reseller product, add a persistent DB for customer records, plans, expiry, billing, domain mappings and audit logs.
