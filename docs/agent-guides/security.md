# Security boundaries

Use for auth, external input, files, integrations, assets, URLs, or secrets.

## Untrusted inputs

Validate/parse before trust:

- HTTP bodies, params, headers, cookies, websocket messages;
- project files, migrations, spreadsheets, imports;
- custom HTML/CSS/views, translations, served assets;
- automation payloads, third-party responses;
- externally supplied paths/filenames.

Validate shape and domain constraints at the owning boundary. Keep existing parser/validation layers; avoid downstream defensive casts.

## Authentication and authorisation

- Keep protected routers behind auth middleware in `apps/server/src/app.ts`.
- Preserve auth across prefixed routes, redirects, websockets, generated links.
- Scope session cookies to runtime prefix; isolate hosted clients.
- Authentication never grants arbitrary file, path, project, or rundown access.

## Files, URLs, integrations

- Use established path/file helpers. Reject traversal and unexpected types.
- Build URLs with `URL` or existing helpers. Check open redirects, SSRF, protocol changes, token leaks.
- Encode/constrain untrusted HTML, CSS, filenames, headers, log values.
- Preserve cloud limits on local-network capabilities.

## Secrets and diagnostics

- Never commit/log passwords, hashes, tokens, credentials, cookies, private project content.
- Errors: useful, but no internal paths, stacks, credentials, sensitive payloads.
- Keep tokens in existing session/authenticated-share flows. Avoid new URL-token patterns.

## Review prompts

- Where does input become trusted?
- Validation once at owner, then useful type?
- Can one prefixed client cross another client's session/assets?
- Can logs, responses, redirects, URLs leak secrets?
