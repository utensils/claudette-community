# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# claudette-community

Community-contributed themes, plugins, grammars, and recipes for the [Claudette](https://github.com/utensils/Claudette) desktop app. This repo is the source of truth that the in-app Claudette registry will consume (registry feature: see issues).

## Repository purpose

Claudette ships a small set of bundled extensions. This repo collects the larger universe of community contributions across the same extension surface. Each contribution lands as a directory under the appropriate top-level kind directory.

## Layout

```
themes/                          # CSS palettes ([data-theme] blocks)
plugins/
  scm/                           # SCM provider Lua plugins
  env-providers/                 # Env-provider Lua plugins
  language-grammars/             # TextMate grammar plugins (declarative)
slash-commands/                  # (forthcoming) reusable /commands
mcp-recipes/                     # (forthcoming) MCP server presets
registry.json                    # hand-curated index — seed for the future auto-generated registry
.github/ISSUE_TEMPLATE/          # contribution issue templates
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

## Working in this repo

- **Conventional Commits** — same as Claudette (`feat:`, `fix:`, `docs:`, `chore:` …). Header max 100 chars.
- No build step — this repo is currently a content/document repo. CI will be added when the registry feature lands (likely a JSON-schema validator + manifest linter).
- Don't hand-edit `registry.json` to add new contributions until the schema is finalized; for now keep it as the documented stub.
- New contributions: drop into the right kind directory as a sibling of `_example/`. Don't modify `_example/` itself unless you're improving the starter for everyone.

## Contributor guidance

- Each contribution is a self-contained directory with the manifest + assets.
- Copy `_example/` rather than starting from scratch.
- Test the plugin/theme against a current Claudette dev build before submitting.
- Include a `README.md` inside your contribution directory describing what it does.

## Things that intentionally aren't here yet

- Auto-generated `registry.json` — comes with the registry feature.
- CI manifest validation — comes with the registry feature.
- Versioning per contribution — TBD; today the repo's git SHA is the version.
- An installer CLI — TBD.

When in doubt, file an issue rather than guessing at conventions.
