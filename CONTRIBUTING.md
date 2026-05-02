# Contributing

Thanks for considering a contribution. This guide covers the shared flow; per-kind specifics (manifest fields, schema, etc.) live in each directory's `README.md`.

## Flow

1. **Open a discussion issue** (optional but recommended). Use the matching template under [Issues → New](https://github.com/utensils/claudette-community/issues/new/choose).
2. **Fork** this repo.
3. **Copy** the relevant `_example/` directory under the right kind directory and rename it. Example: `cp -r plugins/scm/_example plugins/scm/forgejo`.
4. **Edit** the manifest, code/CSS, and any assets. Add a short `README.md` inside your contribution directory that describes what it does and lists any external CLIs or files it depends on.
5. **Test** against a current Claudette dev build:
   - Plugins: drop the directory into `~/.claudette/plugins/<your-name>/` and restart Claudette.
   - Themes: paste the CSS into Claudette's theme directory (manual flow until the registry feature lands).
6. **Open a PR.** Use a Conventional Commits title — e.g. `feat(scm): add forgejo provider` or `feat(theme): add catppuccin-mocha`.
7. Maintainers apply one of the kind labels (`theme`, `plugin:scm`, `plugin:env-provider`, `plugin:language-grammar`, `slash-command`, `mcp-recipe`) plus `submission` and `needs-review`.

## Naming

- Plugin directory name = manifest `name` field (e.g. `forgejo`). Kebab-case, no leading prefix like `scm-` (the kind directory already conveys that).
- Theme id = directory under `themes/` and the `id` in the theme manifest. Kebab-case.

## Schema sources of truth

Manifest schemas live in the Claudette repo. If you want to know what fields are valid, look there:

- Plugin manifest: [`src/plugin_runtime/manifest.rs`](https://github.com/utensils/Claudette/blob/main/src/plugin_runtime/manifest.rs)
- Lua host API: [`src/plugin_runtime/host_api.rs`](https://github.com/utensils/Claudette/blob/main/src/plugin_runtime/host_api.rs)
- Built-in theme metadata: [`src/ui/src/styles/themes/index.ts`](https://github.com/utensils/Claudette/blob/main/src/ui/src/styles/themes/index.ts)

If you want a new manifest field, propose it in the Claudette repo first.

## License

By submitting a contribution you agree to license it under this repository's [MIT License](LICENSE). If your contribution embeds third-party content (e.g. a TextMate grammar from another open-source project), include a `NOTICE` file in your contribution directory crediting the upstream and noting its license.

## Quality bar

- Plugins must pass `host.exec` failures gracefully — never panic the runtime.
- Themes must define the full set of CSS custom properties Claudette consumes (use a built-in theme as a template; missing tokens fall back to defaults but produce a visually broken result).
- Grammars should come from a maintained upstream (cite it in `NOTICE`) — don't hand-write a grammar from scratch unless no upstream exists.
- Keep the contribution self-contained. No build steps, no transitive deps.

## Code of conduct

Be kind. We're all here to make Claudette nicer for everyone.
