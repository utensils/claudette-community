# Language grammar plugins

Declarative plugins that ship a TextMate grammar plus language metadata. They power syntax highlighting in chat code blocks, the diff viewer, and the file editor.

**No `init.lua` is needed for this kind.** No Lua VM is spawned. The plugin is pure JSON + grammar files.

## Layout

```
plugins/language-grammars/<your-name>/
├── plugin.json
├── grammars/
│   └── <lang>.tmLanguage.json
├── NOTICE                       # required if the grammar comes from an upstream project
└── README.md
```

## Manifest (`plugin.json`)

```jsonc
{
  "name": "lang-toml",
  "display_name": "TOML",
  "version": "1.0.0",
  "description": "TOML language syntax highlighting",
  "kind": "language-grammar",
  "operations": [],
  "languages": [
    {
      "id": "toml",
      "extensions": [".toml"],
      "filenames": ["Cargo.lock"],
      "aliases": ["TOML"]
    }
  ],
  "grammars": [
    {
      "language": "toml",
      "scope_name": "source.toml",
      "path": "grammars/toml.tmLanguage.json"
    }
  ]
}
```

Field semantics mirror VS Code's `contributes.languages` / `contributes.grammars` — you can lift entries directly from a `package.json` shipped in a `.vsix`. Source of truth: [`LanguageContribution` and `GrammarContribution` in `src/plugin_runtime/manifest.rs`](https://github.com/utensils/Claudette/blob/main/src/plugin_runtime/manifest.rs).

## Sourcing the grammar

Don't hand-write a TextMate grammar from scratch. Lift it from a maintained upstream and credit it:

1. Find a well-maintained `.tmLanguage.json` (often in a VS Code language extension or the `tree-sitter`-grammar org's repo).
2. Copy the grammar file into `grammars/<lang>.tmLanguage.json`.
3. Add a `NOTICE` file in your plugin directory citing the upstream URL, commit SHA, and license.

## Path safety

The loader rejects `path` values that escape the plugin directory via `..` or symlinks. Keep grammars inside `grammars/`.

## Submitting

```sh
cp -r plugins/language-grammars/_example plugins/language-grammars/lang-toml
$EDITOR plugins/language-grammars/lang-toml/plugin.json
# Drop the upstream grammar file into grammars/
```

Then open a PR. Maintainers apply `plugin:language-grammar` and `submission`.
