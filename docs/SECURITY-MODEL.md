# Security model

## Scope and evidence

This model describes the implemented source in this repository. It is a bounded design record, not a security certification. Revisit it when the app gains remote access, identity, persistence, or another upload destination.

## Assets and trust boundaries

| Boundary | Attacker-controlled input and sink | Current control |
| --- | --- | --- |
| Browser to app | Local file, filename, and upload request reach the client feature and `/api/stt/jobs` | Extension/size checks for usability; server streams with a body limit; upload Origin must match the request's loopback `Host` and port; no file contents are stored in the app |
| Browser transcript review to app | `PUT /api/stt/jobs/{jobId}/transcript` carries segment IDs and editable text to the service | The route validates the job ID; the proxy requires matching local Origin/Host, accepts JSON only, bounds the body to 16 MiB, and forwards only to the fixed service path. The frontend sends the full ID/text set; the service contract owns full schema validation and persistence |
| App network exposure | HTTP routes can submit jobs and read job outputs | `dev` and `start` scripts bind Next.js to `127.0.0.1` only, matching the single-computer product boundary |
| App to local STT service | Service status, JSON, TXT/SRT and media-processing outcomes | Server-only adapter; fixed default `http://127.0.0.1:8000`; configured URL must use loopback HTTP; no browser-supplied host/path; redirects rejected; no-store responses |
| Upstream path construction | Job ID and result format are interpolated into route paths | Job IDs must be 32 lowercase hex characters; the format allowlist is `json`, `txt`, `srt`, and `original-json`. The UI downloads only the first three; `original-json` loads the immutable original view |
| Download response | The STT service controls response content and download disposition | Only content type and content disposition are passed through; responses add `Cache-Control: no-store` and `X-Content-Type-Options: nosniff` |
| Dependencies and build | Package versions, scripts, Next.js config, and fonts influence execution | Playwright is a development-only dependency for controlled tests; no runtime dependency was added; next.config.ts isolates test output in `.next-stt-test`, disables the Turbopack build filesystem cache to avoid stale CSS, and keeps experimental.agentFeedback enabled |

There is no account, authentication, authorization, database, transcript archive, or persistent browser state. The app tracks one job only in the open page. The local STT service retains source and result data temporarily under its own retention policy. The result and job-status GET routes do not check Origin or user identity; job ownership is a service-side contract and was not tested against a live service in this frontend review.

## Key invariants

1. The service destination is server configuration, never user input. Accept only `http:` URLs for `localhost` or `127.0.0.1`, with no credentials, path, query, or fragment.
2. Stream uploads and do not buffer large media in application memory. Reject non-multipart uploads, invalid lengths, cross-origin POSTs, and bodies over the configured size envelope. Transcript updates require JSON, matching local Origin/Host, and a 16 MiB body limit. The Origin comparison accepts only a `localhost` or `127.0.0.1` Host on the same request port; this avoids relying on Next.js's internal `request.url` hostname.
3. Keep service responses uncached and reject upstream redirects. Never trust service JSON until it is parsed into the domain types.
4. Use text rendering for original and edited transcript segments. Do not inject service transcript text as HTML. Send only segment IDs and text from the frontend; the service contract is responsible for rejecting timing, structure, and ID changes.
5. Keep Next.js bound to loopback for local runs. Reassess the route threat model before exposing a reverse proxy, tunnel, container, or LAN listener.
6. Do not log or include media, transcript contents, credentials, or private data in reports.

## Abuse cases in scope

- A cross-origin web page attempts to submit a file through the browser: the upload route requires an Origin equal to the request origin.
- A request tries to turn the BFF into a general-purpose proxy: upstream base URL is fixed/configured and constrained to loopback; route paths are assembled from validated identifiers and fixed formats.
- A client omits or lies about Content-Length: the streamed request body is bounded independently.
- A service response redirects to another host or includes unsafe content headers: redirects are rejected and only a narrow response header allowlist is forwarded.
- An oversized or unsupported media file is selected: the UI provides early feedback, while the service remains authoritative for media parsing, duration, queue, and size constraints.

The endpoint has no authentication because the accepted product is single-user and local-only. That assumption depends on the loopback bind. Do not deploy this app publicly or expose it on a LAN without a new identity/access design.

## Review and verification

Use `.agents/skills/security-review/SKILL.md` for every application-code, dependency, CI, or executable-configuration diff. Review the actual working-tree scope, caller-to-sink data flow, attacker preconditions, controls, excluded files, and validation evidence. Run the host Codex Security diff scan when available; otherwise record the manual-review limitation explicitly. A clean result applies only to the reviewed diff and is not a certification.

## Standards index

Use OWASP Top 10:2025 to select only risks that the changed boundaries expose. Select an ASVS 5.0.0 requirement or WSTG v4.2 scenario only after reading its exact versioned text and verifying that it applies to this local upload/proxy path. Do not infer compliance from the presence of a control or checklist.
