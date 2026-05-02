# Env-provider plugins

Env-provider plugins populate the environment for workspace subprocesses (terminals, agent CLI invocations, etc.). Examples that ship with Claudette: `env-direnv`, `env-mise`, `env-dotenv`, `env-nix-devshell`.

## Layout

```
plugins/env-providers/<your-name>/
├── plugin.json
├── init.lua
└── README.md
```

## Manifest (`plugin.json`)

```jsonc
{
  "name": "asdf",
  "display_name": "asdf",
  "version": "1.0.0",
  "description": "Activate asdf-managed runtimes for workspace subprocesses",
  "kind": "env-provider",
  "required_clis": ["asdf"],
  "operations": ["detect", "export"],
  "settings": [
    {
      "type": "boolean",
      "key": "include_global",
      "label": "Include global versions",
      "description": "Use global versions when no .tool-versions is present",
      "default": true
    }
  ]
}
```

`settings` becomes a typed form in Claudette's Plugins settings section. Read values back in Lua with `host.config("include_global")`.

## Required Lua functions

| Function | Returns | Purpose |
|---|---|---|
| `M.detect(args)` | `boolean` | Should this provider activate for the given workspace? `args` includes `worktree`, `branch`. |
| `M.export(args)` | `{env = {KEY = "value", …}, watches = {"path", …}, error = nil}` | Computed env + cache invalidation paths. |

The `watches` list is what the cache invalidates on. For direnv that's `.envrc` plus everything in `DIRENV_WATCHES`; for dotenv it's `.env` files.

Source: [`src/env_provider/`](https://github.com/utensils/Claudette/blob/main/src/env_provider/) in the Claudette repo. The bundled [`env-direnv`](https://github.com/utensils/Claudette/blob/main/plugins/env-direnv/init.lua) plugin is a good reference.

## Submitting

```sh
cp -r plugins/env-providers/_example plugins/env-providers/asdf
$EDITOR plugins/env-providers/asdf/{plugin.json,init.lua}
```

Then open a PR. Maintainers apply `plugin:env-provider` and `submission`.
