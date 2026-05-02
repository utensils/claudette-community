<!--
Conventional Commit title required, e.g.:
  feat(theme): add catppuccin-mocha
  feat(scm): add forgejo provider
  feat(env-provider): add asdf
  feat(language-grammar): add toml
  fix(theme): correct rose-pine accent token
-->

## What is this

<!-- One paragraph: what's being added/changed and why. -->

## Kind

- [ ] Theme
- [ ] SCM plugin (`plugin:scm`)
- [ ] Env-provider plugin (`plugin:env-provider`)
- [ ] Language grammar plugin (`plugin:language-grammar`)
- [ ] Slash command (forthcoming)
- [ ] MCP recipe (forthcoming)
- [ ] Docs / repo infrastructure

## Checklist

- [ ] Directory name matches the manifest `name` / theme `id` (kebab-case).
- [ ] `README.md` inside the contribution directory describes what it does and lists any external CLI / upstream sources.
- [ ] Tested against a current Claudette dev build (manual install).
- [ ] If a grammar is lifted from upstream, a `NOTICE` file is included citing source URL, commit SHA, and license.
- [ ] No secrets, tokens, or environment-specific paths are committed.
