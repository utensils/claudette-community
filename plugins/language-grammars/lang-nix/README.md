# lang-nix

Nix language syntax-highlighting grammar for [Claudette](https://github.com/utensils/Claudette).

Lights up `.nix` files in chat code blocks, the diff viewer, and the Files tab editor by contributing a TextMate grammar via Claudette's `language-grammar` plugin kind.

## Install

### Future (recommended): in-app Community registry

Once the [Community registry](https://github.com/utensils/Claudette/issues/567) ships, install this grammar from **Settings → Community → Browse → Language grammars**. One click, no shell.

### Today: manual copy

Until the in-app registry lands, copy this directory into Claudette's plugins directory:

```bash
# from a checkout of utensils/claudette-community
cp -R plugins/language-grammars/lang-nix ~/.claudette/plugins/lang-nix
```

Restart Claudette. The plugin shows up under **Settings → Plugins** and applies automatically to any `.nix` file you open.

## Layout

```
plugin.json                       # manifest (kind: language-grammar)
grammars/nix.tmLanguage.json      # TextMate grammar
NOTICE                            # upstream attribution + MIT license text
```

## Grammar source

The TextMate grammar is sourced from [nix-community/vscode-nix-ide](https://github.com/nix-community/vscode-nix-ide), distributed via [shikijs/textmate-grammars-themes](https://github.com/shikijs/textmate-grammars-themes). MIT licensed — see [`NOTICE`](./NOTICE) for the full attribution.

## License

The grammar file retains its upstream MIT license. The plugin manifest and supporting files are MIT — see [`NOTICE`](./NOTICE).
