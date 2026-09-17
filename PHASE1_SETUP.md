# Phase 1 local Windows setup

No recurring cloud service was added. Existing Groq/Ollama and Piper providers are unchanged. NottiPay is untouched. Start with all paid services disabled.

## Restore and run

1. From the repository root, run `npm ci`.
2. Run `npm run setup:backend`. This restores the existing lockfile with legacy peer resolution, skips unused dependency install scripts, and downloads the existing SQLite prebuild for the installed Electron version. Backend tests/runtime use Electron's bundled Node, not system Node 24. Do not run a plain backend native rebuild against Node 24 afterward.
3. Review `backend/.env.example` and configure your existing `backend/.env` locally. Secret values are never committed. Providers are optional. `JWT_SECRET` may be absent/blank for a generated per-process secret; an explicitly configured weak secret fails startup.
4. Run `npm run electron:dev` (or `start-vezora.bat`). Electron exclusively starts, pairs with, supervises and stops its backend. Do not run a second standalone backend or use the old skip-backend switch. Browser-only Vite preview cannot access the protected backend; use Electron for functional development.
5. Sign in after a new backend session. Tokens are session-storage only, have an eight-hour maximum and are invalidated on logout or backend restart. Refresh is deliberately disabled pending durable rotation.

Development retains `backend/data`. The packaged app uses Electron `userData/data` and reads optional configuration from `userData/.env`; it does not import or overwrite an old database automatically. Back up old data before any later migration. Data remains ordinary SQLite, not SQLCipher encryption. Use Windows account protections/disk encryption as appropriate.

## Capabilities and configuration

- `ENABLE_FILE_SYSTEM=false` and `ENABLE_APP_LAUNCH=false` are safe defaults; enable only deliberately.
- `VEZORA_APPROVED_ROOTS` is a JSON array of absolute directories, e.g. `["D:/Documents/Vezora"]`. An empty array permits no files. Avoid broad home/system roots. Links/junctions, traversal, private key/config files and oversized/binary reads are rejected. Writes and OS file opening remain disabled pending race-safe Windows handles.
- Apps use fixed executable paths for Notepad, Calculator, Paint, Explorer, Chrome, Edge, Firefox and per-user VS Code. Missing installations fail clearly. Terminal/shell/custom command strings and arguments are not accepted. Launch requires a ticket confirmation.
- `PORT` is set to zero by Electron, selecting a free port bound only to 127.0.0.1. `VEZORA_TRANSPORT_TOKEN` is generated per launch and sent only through the restricted preload. Do not put it in renderer environment variables or URLs.
- For a deliberately standalone diagnostic backend, use `npm run backend:dev` with a strong temporary `VEZORA_TRANSPORT_TOKEN` environment value. Every request needs `X-Vezora-Token`, and sensitive routes additionally require authenticated user JWT. This mode is not automatically paired with the desktop.
- `GROQ_API_KEY`, `GROQ_MODEL`, `OLLAMA_BASE_URL` and `OLLAMA_MODEL_NAME` retain existing behavior. No paid provider is required for local tasks/files/apps. Ordinary model reasoning still needs an available configured model.
- `PIPER_DIR` may point to your existing trusted external Piper installation; `PIPER_VOICE_MODEL` retains its model override. Developer binaries/models are intentionally not copied into installers. Packaged Piper needs this explicit installation/configuration; otherwise the existing speech fallback/error remains.
- Google/OAuth, workflows/reminders, OCR, legacy memory/settings/log endpoints, alternate stream/intent/coordinator routes and unconstrained settings tools are disabled pending safe migration. No Google token file is read by startup. Existing stored data is preserved.

## Validation and packaging

`npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, `npm run electron:build`, then `npm run test:desktop` and `npm run test:desktop -- --dev`.

The lint gate uses `eslint-baseline.json`, generated only from pre-Phase-1 HEAD. It tracks existing rule counts rather than disabling rules globally; new files have no suppression. `npm run lint:strict` exposes the remaining backlog. Existing React hook warnings are reported. Do not regenerate the baseline to hide a regression.

The installer build stages explicit source plus restored dependencies in `.package/backend`, then writes `release-phase1`. Rebuilding deletes only that generated staging directory after validating its path/marker. Existing `release` artifacts are left untouched and must not be distributed: the audit found private backend artifacts there.

`npm run package:verify` scans unpacked resources and app.asar paths. `npm run test:desktop` starts a hidden Electron with a temporary database and missing env file, checks packaged native startup, preload isolation, paired HTTP, renderer confirmation and shutdown. It does not access your real account or call providers. Both modes install the same CSP helper as the main window and require a visible login form without startup errors. Packaged mode additionally verifies that an injected inline script cannot execute. Development mode starts/stops its own Vite server on port 5173 (close electron:dev first), checks the React Refresh preamble and HMR websocket, and uses temporary backend/profile data. Screenshots are written to ignored `tmp/renderer-packaged.png` and `tmp/renderer-dev.png`; pass `--show` for a visible smoke window.

The generated installer is unsigned and retains the existing Electron version. Review dependency advisories and upgrade the old runtime in an explicitly scoped follow-up before distributing beyond trusted personal testing. No paid signing service was added.

## Manual Windows checks

- Launch from the batch file; sign in, create/list tasks, cancel/approve a deletion, and verify the UI updates only after completion.
- Try enabled allowlisted app launch and unsupported app/argument rejection; confirm missing apps produce an error.
- Configure a small test folder and verify read/list plus rejection outside it. Use disposable fixtures, not private folders.
- Close Vezora and confirm its companion exits; reopen and verify fresh sign-in. Check a second launch focuses the existing app.
- Verify existing microphone permission and configured Piper playback; full voice cancellation/barge-in is explicitly outside Phase 1.
- In a disposable Windows profile/VM, install/uninstall the unsigned build and verify data resides outside installation resources. Do not overwrite your existing personal install for this check.

## Renderer CSP

The packaging state, not NODE_ENV, selects the policy in desktop/csp.js. Production retains script-src 'self'. Only development adds script-src 'unsafe-inline' for Vite's injected React Refresh preamble; neither mode permits unsafe-eval. Development alone permits the Vite websocket at ws://localhost:5173.

The existing Google Fonts import is allowed only through style-src https://fonts.googleapis.com and font-src https://fonts.gstatic.com. No script or general connection permission is granted to Google. Locally bundling the existing fonts is the preferred later improvement for offline availability and avoiding external font requests; it is not part of this regression fix.
