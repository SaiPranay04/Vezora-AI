# Phase 1 report — secure local Windows/Electron foundation

Completed on astra-renovation, 17 September 2026. Phase 2 has not started. NottiPay was not inspected or modified during Phase 1. No LLM/STT/TTS provider was replaced; no recurring paid dependency or cloud gateway was added. Default operating cost remains £0/month apart from optional existing API use, electricity and hardware.

## Implemented

- Electron now uses context isolation, disabled Node integration, sandboxing, a fixed preload method, owning-main-frame validation, navigation/window restrictions and a renderer CSP. No generic shell, filesystem or IPC channel is exposed to the renderer.
- Electron owns a bundled-runtime utility backend, waits for validated readiness instead of sleeping, enforces a single instance, reports startup/crash failure and requests bounded graceful shutdown. Existing Piper children are tracked/stopped during normal backend shutdown; request disconnect/timeout also stops generation. This is lifecycle hardening, not the voice redesign.
- Backend binds 127.0.0.1 on an ephemeral desktop-selected port. Every HTTP request requires a per-launch pairing token; sensitive APIs additionally require a verified user JWT. Host/origin checks prevent untrusted browser origins. Unimplemented WebSocket upgrades are rejected. Duplicate limiter mounting was removed.
- Request identity comes from authenticated async context, never caller-supplied userId. Tools fail closed unless permission explicitly allows execution. Risk comes from the registry; incomplete tool policy is denied.
- Tickets clone validated arguments, hash their canonical form, bind tool/user/session/expiry and random nonce, and are consumed synchronously before any awaited handler. Replay, wrong identity/session, tampering and expiration are denied. Cancellation also checks ownership. /execute cannot accept caller approval; /confirm consumes the stored operation.
- File/app legacy API entry points use the same executor. Direct task/memory deletion requires its ticket, and the existing UI transport completes explicit confirmation before reporting success. Fuzzy coordinator deletion is disabled.
- File read/list requires configured approved roots, boundary-aware canonical validation, rejection of traversal, sibling-prefix and link/junction paths, private-file checks and bounded UTF-8 reads. There is no implicit whole-home grant.
- App launch resolves fixed executable paths without shell interpolation and accepts no arguments. Supported installed apps are Notepad, Calculator, Paint, Explorer, Chrome, Edge, Firefox and per-user VS Code. Unknown/custom commands and terminals fail explicitly.
- Config loads before route/provider imports. Pairing/port/feature/root/JWT configuration is validated. There is no known JWT fallback secret. Access tokens are type/algorithm/boot bound, expire after eight hours, and are revoked on logout. Restart invalidates all old tokens. Renderer credentials use sessionStorage; old localStorage tokens are discarded.
- Packaging uses an explicit source staging policy; environment files, credentials, databases, runtime data and private keys are excluded. Mutable state lives outside packaged resources. Raw prompt/path/arbitrary metadata is no longer persisted in activity logs.
- Local deterministic chat tools no longer depend on Ollama health. Model providers otherwise retain existing behavior.

## Intentionally unavailable behavior

These restrictions are explicit; they are not claimed as migrated features:

- Arbitrary shell/terminal commands, app arguments and unknown executable paths.
- File writes and OS-default file opening until race-safe Windows handle operations exist.
- Global Google OAuth/Gmail/Calendar agent access, workflow execution and reminder startup.
- Legacy OCR, search, memory/settings/log APIs; alternate stream/intent/coordinator endpoints; unconstrained settings tool.
- Fuzzy task deletion by coordinator.
- Refresh tokens until durable rotation/revocation is designed. Sign in after restart or expiry.
- Unpaired browser-only backend access and attaching Electron to an externally started backend.
- Bundling a developer's unverified Piper binaries/models. Existing Piper remains available through a trusted external PIPER_DIR/model configuration; no replacement speech engine was installed.

Existing personal databases/configuration were not migrated or deleted. Existing release/ output was not cleaned or distributed; it remains unsuitable for distribution because the earlier audit found private files there.

## Dependency/runtime resolution

Root npm ci succeeded. Backend plain npm ci exposed the existing LangChain/Zod optional-peer conflict and the locked SQLite module's missing Node 24 prebuild. The documented setup restores the unchanged lockfile using legacy peer resolution and no install scripts, then installs the SQLite binary for existing Electron 30.5.1. Tests and companion use Electron's bundled Node 20.16.0, avoiding system Node ABI mismatch. bcrypt and native SQLite were exercised by real registration/database tests. No dependency version or provider change was needed.

## Validation results

- npm run typecheck: PASS.
- npm run lint: PASS with the checked-in baseline and 10 existing React hook warnings. The baseline was generated from committed pre-Phase-1 HEAD only, recording 87 errors. Current strict lint still reports 82 legacy errors; this is not a claim of a clean strict-lint repository. New files have no suppression; npm run lint:strict exposes debt.
- npm test: 18 tests PASS, zero failures/skips. Covers denial, expiry, modified args, tool mismatch, owner/session mismatch, cancellation ownership, unique nonces, replay/concurrent replay, caller identity, flags, unsafe app commands, traversal/sibling-prefix/junction escape, file limits, JWT separation/revocation, IPC exposure/readiness/timeout, child shutdown and packaging policy.
- Real HTTP integration: PASS using temporary SQLite and no provider credentials. Covers unpaired/unauthenticated/foreign-origin rejection, registration, user ownership despite supplied userId, offline local-tool chat, confirmed deletion, replay, disabled routes, logout and graceful shutdown.
- npm run build: PASS. Existing large-chunk and stale Browserslist-data warnings remain.
- npm run electron:build: PASS. Windows x64 NSIS installer generated, with package verification included.
- Package scan: PASS across 24,126 resource files plus app.asar paths; no .env, token/credential file, runtime database/data directory or private-key artifact found. This is a path/inclusion audit, not a mathematical guarantee against an unknown secret embedded in arbitrary source text.
- npm run test:desktop: PASS, exit 0. Hidden Electron loaded the packaged backend with native SQLite, real sandboxed preload and built renderer; verified no renderer Node access, restricted bridge, paired health, actual renderer confirmation round-trip and clean backend shutdown. Temporary Chromium profile is removed after process exit. One Chromium GPU teardown warning was emitted without test failure; visual checks remain manual.
- git diff --check: PASS; security/auth/transport/packaging changes inspected before commit.

Artifact: release-phase1/Vezora AI Setup 0.0.0.exe (unsigned).
SHA-256: 2CBAE8ADD01DE1A6AB16B293DF9D6572B5FF7024F6CDF7A6ED27C6C261D2CAF1
Hash verified against the final artifact before commit.

## Remaining risks and limits

1. Electron 30 and the existing dependency tree are old. Restore reported 30 root and 34 backend npm advisories (overlapping trees; not an additive count of exploitable defects). Advisory remediation/runtime upgrade is still needed before broader distribution. No claim of a vulnerability-free release is made.
2. SQLite and existing local configuration remain unencrypted. This is a personal same-Windows-account boundary, not isolation from a hostile process already running as that account. Secrets outside the installer must be protected using Windows account/disk controls; OS-backed persistent integration credentials remain future work.
3. Approved-path checks reject static junction/link escapes, but are not a Windows kernel capability sandbox against a hostile local actor racing path changes. Writes/opening stay disabled; keep approved roots narrow and controlled. Broad roots can still contain sensitive documents not identifiable by filename.
4. Conversation storage, memory deduplication/deletion key semantics, retrieval relevance and some UI behaviors remain legacy. Memory deletion semantics need review before native model tool calling is expanded. No memory schema migration or Phase 2 orchestrator was introduced.
5. Session-only confirmation/revocation state intentionally disappears on restart, and all old tokens become invalid. Automatic side-effect replay is never attempted. The UI can require fresh sign-in after network/backend failure.
6. Built-in app paths do not discover every installation layout. Unsupported paths fail instead of becoming a shell command.
7. The hidden harness verifies packaged components and transport, not every main-window UX or an installed Windows profile. No production email, finance, provider billing, real microphone or live Piper synthesis tests were performed.
8. Installer is unsigned, uses the existing version/default icon and is for trusted personal evaluation. Startup crash handling is conservative; it does not attempt automatic recovery/replay.

## Manual Windows review

Follow PHASE1_SETUP.md. Check development launch, fresh login, task create/list/delete approval and cancellation, approved-folder reads, allowlisted app launches, second-instance focus, backend exit on close and restart login. Verify existing microphone/Piper setup without assuming new voice capabilities. Test install/uninstall and data placement only in a disposable Windows profile/VM, preserving your existing data.

## Phase 2 entry criteria

User review/approval of Phase 1; acceptance of explicit disabled features; manual desktop checks; a separate decision on the old Electron/dependency advisory backlog before distribution; retained passing security tests and clean packaging. Then define a bounded provider-neutral orchestrator/streaming scope, preserving £0/local-first operation. No NottiPay or voice redesign begins automatically.

## Changed-file manifest

- .gitignore
- ASTRA_RENOVATION_PLAN.md
- PHASE1_REPORT.md
- PHASE1_SETUP.md
- backend/.env.example
- backend/bootstrap.js
- backend/config.js
- backend/controllers/appsController.js
- backend/controllers/filesController.js
- backend/controllers/logsController.js
- backend/core/permissions.js
- backend/core/toolExecutor.js
- backend/core/toolRegistry.js
- backend/index.js
- backend/middleware/auth.js
- backend/package.json
- backend/routes/apps.js
- backend/routes/authRoutes.js
- backend/routes/chat.js
- backend/routes/files.js
- backend/routes/structuredMemory.js
- backend/routes/tasks.js
- backend/routes/tools.js
- backend/routes/tts.js
- backend/security/children.js
- backend/security/identity.js
- backend/security/paths.js
- backend/security/transport.js
- backend/services/coordinatorService.js
- backend/services/ttsService.js
- backend/utils/database.js
- backend/utils/jwt.js
- backend/utils/voyageClient.js
- desktop/lifecycle.js
- desktop/preload.cjs
- eslint-baseline.json
- eslint.config.js
- main.js
- package.json
- scripts/electron-node.mjs
- scripts/package-policy.mjs
- scripts/prepare-package.mjs
- scripts/restore-backend.mjs
- scripts/run-smoke.mjs
- scripts/smoke-desktop.cjs
- scripts/verify-package.mjs
- src/contexts/AuthContext.tsx
- src/desktop.d.ts
- src/lib/desktopTransport.ts
- src/main.tsx
- start-vezora.bat
- tests/desktop.test.js
- tests/executor.test.js
- tests/paths.test.js
- tests/policy.test.js
- tests/server.test.js
