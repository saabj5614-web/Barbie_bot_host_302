# 𝐁𝐀𝐑𝐁𝐈𝐄 Hosting Panel

Owner-only personal hosting dashboard with **4 fixed Oracle Cloud server slots**.

## Final direction

- Exactly 4 fixed server slots.
- Oracle Cloud Compute is the backend control layer.
- CPU is not hard-fixed per server; OCI shape capacity is reported by the backend.
- No 50 GB hard reservation is enforced by the panel.
- Each server has its own management view and Oracle console-connection action.
- Start / Stop / Restart controls use OCI Compute lifecycle actions.
- GitHub public/private repository inspection is available; private access stays server-side.
- Long-running workloads run on Oracle Compute, not Vercel.

## Oracle environment variables

Configure these in Vercel Project Settings > Environment Variables:

- `OCI_TENANCY_OCID`
- `OCI_USER_OCID`
- `OCI_FINGERPRINT`
- `OCI_REGION`
- `OCI_PRIVATE_KEY`
- `OCI_PASSPHRASE` (optional)
- `OCI_SLOT_1_INSTANCE_OCID` through `OCI_SLOT_4_INSTANCE_OCID`
- `OCI_SLOT_1_NAME` through `OCI_SLOT_4_NAME`
- `GITHUB_TOKEN` for private repository inspection

Do not commit OCI private keys or other secrets to GitHub.

## Console note

OCI instance console connections are SSH-based. The panel creates an OCI console-connection resource per selected server; a browser terminal/interactive file manager requires a separate server-side agent layer.

Oracle's Compute API supports START, STOP and reset-style instance actions, and Oracle documents instance console connections as SSH-based. citeturn0search0turn0search1turn0search14

## Deployment

Deploy this repository to Vercel as the control/API layer. Add the Oracle variables only after the four OCI instances and credentials are ready.
