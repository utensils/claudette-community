# claudette-community

Community-contributed themes, plugins, grammars, and recipes for [Claudette](https://github.com/utensils/Claudette).

> Status: bootstrapping. The Claudette in-app registry that consumes this repo is tracked in a forthcoming feature issue. Until then, contributions live here as the source of truth and may be installed manually.

## What goes here

| Kind | Directory | What it is |
|---|---|---|
| Theme | `themes/` | Color palette + CSS custom-property overrides applied via `[data-theme="..."]`. |
| SCM plugin | `plugins/scm/` | Lua plugin (`kind: "scm"`) — PR/CI integration for a git host. |
| Env-provider plugin | `plugins/env-providers/` | Lua plugin (`kind: "env-provider"`) — populate workspace subprocess env (direnv, mise, dotenv, …). |
| Language grammar | `plugins/language-grammars/` | Declarative plugin (`kind: "language-grammar"`) — TextMate grammar + language metadata for syntax highlighting. |
| Slash command | `slash-commands/` | (Forthcoming) reusable `/command` definitions. |
| MCP recipe | `mcp-recipes/` | (Forthcoming) MCP server presets. |

Each subdirectory has its own `README.md` describing the manifest schema and pointing at a copy-paste `_example/` starter.

## How to contribute

1. Open a GitHub issue (Theme / Plugin / Bug templates available) — optional but helpful for discussion.
2. Fork the repo, copy the relevant `_example/` directory, rename, and edit.
3. Open a PR. The maintainers apply one of the kind labels (`theme`, `plugin:scm`, `plugin:env-provider`, `plugin:language-grammar`, …) and the `submission` label. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Installing manually (today)

Until the in-app registry lands, drop a plugin into `~/.claudette/plugins/<name>/` (one `plugin.json` + one `init.lua`, plus any grammar files for `language-grammar` kind). Themes will require a manual CSS paste into Claudette's theme directory — flow TBD.

## License

MIT. By submitting a contribution you agree to license it under the repository's MIT license.
