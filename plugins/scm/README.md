# SCM plugins

SCM plugins integrate a git host (GitHub, GitLab, Forgejo, Bitbucket, …) into Claudette's PR list, PR detail view, and CI status badges.

## Layout

```
plugins/scm/<your-name>/
├── plugin.json     # manifest
├── init.lua        # entrypoint — defines M.list_pull_requests etc.
└── README.md       # what the plugin does, what CLI it shells out to
```

## Manifest (`plugin.json`)

```jsonc
{
  "name": "forgejo",                          // kebab-case, matches directory
  "display_name": "Forgejo",
  "version": "1.0.0",
  "description": "Forgejo PR / CI status via the forgejo CLI",
  "kind": "scm",                              // omitting this defaults to "scm" but be explicit
  "required_clis": ["forgejo"],               // CLIs Claudette will permit `host.exec` to invoke
  "remote_patterns": ["codeberg.org", "*.forgejo.example.com"],
  "operations": [
    "list_pull_requests",
    "get_pull_request",
    "create_pull_request",
    "merge_pull_request",
    "ci_status"
  ],
  "config_schema": {}
}
```

Schema source of truth: [`PluginManifest` in `src/plugin_runtime/manifest.rs`](https://github.com/utensils/Claudette/blob/main/src/plugin_runtime/manifest.rs).

### Operations

Each entry in `operations` corresponds to a Lua function on the returned module. The dispatcher in `src/scm/` calls these. Look at the bundled [`scm-github`](https://github.com/utensils/Claudette/blob/main/plugins/scm-github/init.lua) plugin for the canonical input/output shape — that's the contract.

## Lua host API

Plugins run in a sandboxed Luau VM. The standard library is pruned (`os`, `io`, `package`, `require`, `loadfile`, `dofile` are unavailable). The `host` table provides:

| Function | Purpose |
|---|---|
| `host.exec(cmd, {args...})` | Run an allowlisted CLI. Returns `{stdout, stderr, code}`. Times out at 30s. |
| `host.json_decode(str)` / `host.json_encode(table)` | JSON conversions. |
| `host.workspace()` | `{id, name, branch, worktree_path, repo_path}`. |
| `host.config(key)` | Read a user-set value from the manifest's `settings` field. |
| `host.log(msg)` | Append to Claudette's plugin log. |
| `host.file_exists(path)` / `host.read_file(path)` | Filesystem reads (sandboxed). |

Source: [`src/plugin_runtime/host_api.rs`](https://github.com/utensils/Claudette/blob/main/src/plugin_runtime/host_api.rs).

## Submitting

```sh
cp -r plugins/scm/_example plugins/scm/forgejo
$EDITOR plugins/scm/forgejo/{plugin.json,init.lua}
```

Then open a PR. Maintainers apply `plugin:scm` and `submission`.
