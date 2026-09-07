# Domain / secrecy setup

1. Point your own panel domain to Vercel.
2. Keep PTERO_URL and PTERO_APP_KEY only in Vercel Environment Variables.
3. Do not expose the Pterodactyl URL in frontend code.
4. The customer-domain field in the application is only an identifier until DNS + a reverse proxy/gateway are configured.
5. Do not promise customers a direct server domain unless the domain actually resolves to a customer-facing gateway.
6. Use HTTPS and a long OWNER_PASSWORD + OWNER_SESSION_SECRET.
7. 
