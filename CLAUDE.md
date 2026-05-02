# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# claudette-community

Community-contributed themes, plugins, grammars, and recipes for the [Claudette](https://github.com/utensils/Claudette) desktop app. This repo is the source of truth that the in-app Claudette registry will consume (registry feature: see issues).

## Repository purpose

Claudette ships a small set of bundled extensions. This repo collects the larger universe of community contributions across the same extension surface. Each contribution lands as a directory under the appropriate top-level kind directory.

`AGENTS.md` is a symlink to this file — edit `CLAUDE.md` and every agent harness picks up the same content.

## Layout

```
themes/                          # CSS palettes ([data-theme] blocks)
plugins/
  scm/                           # SCM provider Lua plugins
  env-providers/                 # Env-provider Lua plugins
  language-grammars/             # TextMate grammar plugins (declarative)
slash-commands/                  # (forthcoming) reusable /commands
mcp-recipes/                     # (forthcoming) MCP server presets
registry.json                    # auto-generated index — DO NOT hand-edit (run `bun run generate`)
registry.schema.json             # JSON schema for registry.json
manifest.schema.json             # JSON schema for theme.json / plugin.json
revocations.json                 # security revocation list
scripts/
  generate-registry.ts           # walks contributions, computes hashes, emits registry.json
  validate.ts                    # validates manifests against manifest.schema.json
.github/ISSUE_TEMPLATE/          # contribution issue templates
.github/workflows/               # CI: validate (per-PR), regen (push to main), mirror (cron)
```

Each kind directory contains a `README.md` describing its manifest schema and an `_example/` starter that contributors copy.

## Schema sources of truth

The schemas this repo's contributions must conform to live in the Claudette repo, **not** here:

| Kind | Defined in (Claudette) |
|---|---|
| Plugin manifest (`plugin.json`) | `src/plugin_runtime/manifest.rs` (`PluginManifest`) |
| Plugin kinds | `PluginKind` enum: `scm` / `env-provider` / `language-grammar` |
| Lua host API surface | `src/plugin_runtime/host_api.rs` |
| Theme | `src/ui/src/styles/theme.css` (`[data-theme="..."]` blocks) + `src/ui/src/styles/themes/index.ts` (`BuiltinThemeMeta`) |

When making changes that touch contribution schemas, mirror the upstream type. Do not invent new fields here — propose them upstream first.

## Lua plugin runtime (scm, env-provider)

- Plugins run in a sandboxed Luau VM. `os`, `io`, `package`, `require`, `loadfile`, `dofile` are **not** available — don't generate Lua that uses them.
- The only host surface is the `host` table (full list in `plugins/scm/README.md`). `host.exec` is restricted to CLIs listed in the manifest's `required_clis` and times out at 30s.
- `language-grammar` plugins do **not** ship an `init.lua` and no Lua VM is spawned — they're pure JSON plus `grammars/*.tmLanguage.json`.
- The grammar loader rejects `path` values that escape the plugin directory via `..` or symlinks.

## Working in this repo

- **Conventional Commits** — same as Claudette (`feat:`, `fix:`, `docs:`, `chore:` …). Header max 100 chars.
- PR title scopes match the kind: `feat(theme):`, `feat(scm):`, `feat(env-provider):`, `feat(language-grammar):`. Maintainers apply one kind label (`theme`, `plugin:scm`, `plugin:env-provider`, `plugin:language-grammar`, `slash-command`, `mcp-recipe`) plus `submission` and `needs-review`.
- **`registry.json` is auto-generated** by `bun run generate` — never hand-edit. The validator workflow rejects PRs whose committed `registry.json` is out of sync with the contribution tree.
- After adding/editing a contribution, run `bun run check` (validate + generate --check) locally before pushing. Both `validate` and `generate` walk the kind directories and skip anything starting with `_`.
- New contributions: drop into the right kind directory as a sibling of `_example/`. Don't modify `_example/` itself unless you're improving the starter for everyone.
- The `_example/` directories are copy-from templates. Their manifests deliberately use `name: "_example"`, which is **invalid for a real submission** (names must be kebab-case and unique) — copy them, don't try to "fix" them in place.
- A `NOTICE` file is required inside a `language-grammar` contribution when the grammar is lifted from upstream — cite source URL, commit SHA, and license.

## CI commands

```sh
bun install                      # install deps (ajv, ajv-formats)
bun run validate                 # schema-validate every manifest
bun run generate                 # rebuild registry.json from the current tree
bun run generate -- --check      # exit non-zero if registry.json is stale
bun run check                    # validate + generate --check (CI's full PR check)
```

The content hash for each contribution is `sha256(JSON.stringify([{path, sha256}, ...].sortByPath))` — deterministic across runtimes, no tar dependency. Documented in `scripts/generate-registry.ts`.

CI pins Bun to `1.3.11` (`.github/workflows/{validate,regen}.yml`). Match that locally to avoid `bun.lock` churn.

### `--check` elision rule (non-obvious)

`generate -- --check` deliberately ignores two fields when comparing committed `registry.json` against a fresh generation:

- `generated_at` — wall-clock timestamp, drifts every run.
- `sha` (per-entry) — the last-touch commit. A contributor's pre-commit generate sees commit N-1; CI's post-merge generate sees commit N. The `regen.yml` workflow on push to main corrects this drift.

The trust anchor is **`sha256`** (the content hash). If contribution files changed, `sha256` changes and `--check` fails correctly. Don't try to "fix" `sha` mismatches by hand-editing `registry.json` — let `regen.yml` reconcile after merge.

### Cross-cutting invariants enforced by tooling

Both `validate.ts` and `generate-registry.ts` re-check these — bypass one, the other still trips:

- Directory name == `manifest.name` (plugins) or `manifest.id` (themes).
- `manifest.kind` matches the kind directory it lives under (`plugins/scm/...` ⇒ `kind: "scm"`).
- License is in the v1 allowlist (`MIT`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `MPL-2.0`).
- For `language-grammar`: at least one entry each in `languages` and `grammars`; every `grammars[].path` resolves inside the plugin directory (no `..`, no leading `/`).

The schema sets `kind` default to `"scm"` if omitted, but contributions should declare it explicitly — the kind/dir cross-check relies on it.

### Registry signing

`registry.json` is signed with a minisign key after every push to `main`. The
signature lives next to it as `registry.json.sig`; the corresponding public
key is committed at `keys/community-registry.pub` for transparency, and the
same bytes are embedded in the Claudette binary. Claudette refuses any
registry whose signature does not verify — there is no fallback to unsigned
fetch.

The flow:

- **PRs** never have to update `registry.json.sig`. Contributors don't have
  the secret key. `validate.yml` warns if the sig doesn't match a freshly
  changed `registry.json`, but does not fail.
- **Push to `main`**: `regen.yml` regenerates `registry.json`, signs it with
  the secret stored in `COMMUNITY_REGISTRY_MINISIGN_SECRET_KEY`, locally
  verifies with the public key, and pushes both files directly back to
  `main` if they drifted. The push uses `[skip ci]` and is gated on
  committer email so it cannot loop on itself.
- **Healthcheck**: `health.yml` runs every 15 minutes and re-runs
  `minisign -V` against `main` HEAD. If it ever fails — meaning regen
  itself broke or hasn't yet fired — it opens / updates a tracking
  issue. This is the safety net for the window between a contribution
  merge and regen completing.

Why direct push instead of a corrective PR? The corrective PR
historically sat unmerged for ~16 hours after a contribution merge,
during which every Claudette client saw a signature failure (the
binary fails closed on signature mismatch). The push is mechanical —
local `minisign -V` is the real safety check — and direct push closes
that window.

Anyone can verify locally:

```sh
minisign -V -p keys/community-registry.pub -m registry.json -x registry.json.sig
```

Don't hand-edit `registry.json.sig` — let CI regenerate it. See `keys/README.md`
for key-rotation procedure.

### `revocations.json` and `mirrors/`

- `revocations.json` is **fail-closed** per TDD #567: Claudette treats an empty/missing/truncated file as a *fetch failure*, not "nothing revoked." Don't delete it or leave it blank when revoking — add an explicit entry.
- `registry.schema.json` permits `source.type: "external"` for plugins that live outside this repo. None exist yet, so the `mirrors/` directory is also absent. `mirror.yml` (hourly cron) is a working stub that will fail loudly if an external plugin is added before the mirror logic is implemented — that's intentional, not a bug to "fix" by hiding the failure.

## Contributor guidance

- Each contribution is a self-contained directory with the manifest + assets.
- Copy `_example/` rather than starting from scratch.
- Test the plugin/theme against a current Claudette dev build before submitting.
- Include a `README.md` inside your contribution directory describing what it does.

## Things that intentionally aren't here yet

- `schemars`-generated schemas — Claudette PR #2 (per [TDD #567](https://github.com/utensils/Claudette/issues/567)) will replace the hand-written `manifest.schema.json` / `registry.schema.json` with Rust-derived ones uploaded as a CI artifact.
- Lua syntax linting — `validate.ts` doesn't run a Lua parser yet. Add when the first community SCM/env-provider plugin lands.
- Author existence check via the GitHub API — soft-validation only today, deferred to avoid PAT/rate-limit complexity in CI.
- Per-version pinning at install time — registry surfaces only the latest version of each contribution in v1.
- Author signing (cosign / sigstore) — v2.

When in doubt, file an issue rather than guessing at conventions.
