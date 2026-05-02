#!/usr/bin/env bun
//
// Walks the contribution directories under themes/ and plugins/, reads
// each manifest, computes the per-directory git SHA and content hash,
// and emits registry.json.
//
// Modes:
//   bun run generate           — write registry.json
//   bun run generate -- --check — exit non-zero if the file would change

import { spawnSync } from "node:child_process";
import {
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
  existsSync,
} from "node:fs";
import { join, relative, resolve } from "node:path";
import { createHash } from "node:crypto";
import process from "node:process";

const REPO_ROOT = resolve(process.cwd());
const REGISTRY_PATH = join(REPO_ROOT, "registry.json");
const SCHEMA_REL = "registry.schema.json";

const KIND_DIRS = {
  theme: { dir: "themes" },
  "plugin:scm": { dir: "plugins/scm", kind: "scm" },
  "plugin:env-provider": {
    dir: "plugins/env-providers",
    kind: "env-provider",
  },
  "plugin:language-grammar": {
    dir: "plugins/language-grammars",
    kind: "language-grammar",
  },
} as const;

function git(...args: string[]): string {
  const result = spawnSync("git", args, {
    cwd: REPO_ROOT,
    encoding: "utf-8",
  });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed: ${result.stderr}`);
  }
  return result.stdout.trim();
}

function listContributions(dir: string): string[] {
  const abs = join(REPO_ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."))
    .map((name) => join(abs, name))
    .filter((p) => statSync(p).isDirectory());
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store") continue;
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else if (entry.isFile()) out.push(p);
  }
  return out;
}

function contentHash(dir: string): string {
  const entries = walkFiles(dir)
    .map((f) => ({
      path: relative(dir, f).split("\\").join("/"),
      sha256: createHash("sha256").update(readFileSync(f)).digest("hex"),
    }))
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
  return createHash("sha256").update(JSON.stringify(entries)).digest("hex");
}

function lastTouchSha(repoRelPath: string): string {
  return git("log", "-1", "--format=%H", "--", repoRelPath);
}

function firstAddedDate(repoRelPath: string): string {
  // ISO datetime of the first commit that added the path; trim to YYYY-MM-DD.
  const out = git(
    "log",
    "--diff-filter=A",
    "--format=%cI",
    "--reverse",
    "--",
    repoRelPath,
  );
  const first = out.split("\n")[0]?.trim();
  return first ? first.slice(0, 10) : new Date().toISOString().slice(0, 10);
}

function readJson(path: string): any {
  return JSON.parse(readFileSync(path, "utf-8"));
}

type Source =
  | { type: "in-tree"; path: string; sha: string; sha256: string }
  | {
      type: "external";
      git_url: string;
      git_ref: string;
      sha: string;
      sha256: string;
      mirror_path: string;
    };

function buildSource(absDir: string): Source {
  const rel = relative(REPO_ROOT, absDir).split("\\").join("/");
  return {
    type: "in-tree",
    path: rel,
    sha: lastTouchSha(rel),
    sha256: contentHash(absDir),
  };
}

function buildThemeEntry(absDir: string): any {
  const manifest = readJson(join(absDir, "theme.json"));
  const dirName = relative(REPO_ROOT, absDir).split("/").pop()!;
  if (manifest.id !== dirName) {
    throw new Error(
      `theme id "${manifest.id}" does not match dir "${dirName}" at ${absDir}`,
    );
  }
  const rel = relative(REPO_ROOT, absDir).split("\\").join("/");
  return {
    id: manifest.id,
    name: manifest.name,
    description: manifest.description,
    color_scheme: manifest.colorScheme,
    accent_preview: manifest.accentPreview,
    version: manifest.version,
    author: manifest.author,
    license: manifest.license,
    ...(manifest.tags ? { tags: manifest.tags } : {}),
    submitted_at: firstAddedDate(rel),
    source: buildSource(absDir),
  };
}

function buildPluginEntry(absDir: string, kind: string): any {
  const manifest = readJson(join(absDir, "plugin.json"));
  const dirName = relative(REPO_ROOT, absDir).split("/").pop()!;
  if (manifest.name !== dirName) {
    throw new Error(
      `plugin name "${manifest.name}" does not match dir "${dirName}" at ${absDir}`,
    );
  }
  const manifestKind = manifest.kind ?? "scm";
  if (manifestKind !== kind) {
    throw new Error(
      `plugin "${manifest.name}" declares kind "${manifestKind}" but lives under ${kind} directory`,
    );
  }
  const rel = relative(REPO_ROOT, absDir).split("\\").join("/");
  const out: any = {
    name: manifest.name,
    display_name: manifest.display_name,
    version: manifest.version,
    description: manifest.description,
    kind: manifestKind,
    operations: manifest.operations ?? [],
    author: manifest.author,
    license: manifest.license,
    submitted_at: firstAddedDate(rel),
    source: buildSource(absDir),
  };
  if (manifest.required_clis?.length) out.required_clis = manifest.required_clis;
  if (manifest.remote_patterns?.length)
    out.remote_patterns = manifest.remote_patterns;
  if (manifest.config_schema && Object.keys(manifest.config_schema).length)
    out.config_schema = manifest.config_schema;
  if (manifest.settings?.length) out.settings = manifest.settings;
  if (manifest.languages?.length) out.languages = manifest.languages;
  if (manifest.grammars?.length) out.grammars = manifest.grammars;
  if (manifest.tags?.length) out.tags = manifest.tags;
  return out;
}

function build(): any {
  const themes = listContributions(KIND_DIRS.theme.dir).map(buildThemeEntry);
  themes.sort((a, b) => a.id.localeCompare(b.id));

  const plugins = {
    scm: listContributions(KIND_DIRS["plugin:scm"].dir).map((d) =>
      buildPluginEntry(d, "scm"),
    ),
    "env-provider": listContributions(KIND_DIRS["plugin:env-provider"].dir).map(
      (d) => buildPluginEntry(d, "env-provider"),
    ),
    "language-grammar": listContributions(
      KIND_DIRS["plugin:language-grammar"].dir,
    ).map((d) => buildPluginEntry(d, "language-grammar")),
  };
  for (const arr of Object.values(plugins))
    arr.sort((a, b) => a.name.localeCompare(b.name));

  const sourceSha = git("rev-parse", "HEAD");
  const sourceRef = (() => {
    try {
      return git("rev-parse", "--abbrev-ref", "HEAD");
    } catch {
      return "main";
    }
  })();

  return {
    $schema: `./${SCHEMA_REL}`,
    version: 1,
    generated_at: new Date().toISOString(),
    source: {
      repo: "utensils/claudette-community",
      ref: sourceRef === "HEAD" ? "main" : sourceRef,
      sha: sourceSha,
    },
    themes,
    plugins,
    slash_commands: [],
    mcp_recipes: [],
  };
}

function stableSerialize(value: any): string {
  // Hide generated_at when comparing for --check, since it changes every
  // run. The committed file's generated_at is informational.
  return JSON.stringify(value, null, 2) + "\n";
}

function main() {
  const args = process.argv.slice(2);
  const check = args.includes("--check");

  const next = build();
  const nextSerialized = stableSerialize(next);

  if (check) {
    if (!existsSync(REGISTRY_PATH)) {
      console.error(
        "registry.json missing. Run `bun run generate` and commit.",
      );
      process.exit(1);
    }
    const current = JSON.parse(readFileSync(REGISTRY_PATH, "utf-8"));
    // Strip fields whose values legitimately drift between generations
    // of an otherwise-identical contribution tree:
    //   - generated_at: timestamp at run time
    //   - any "sha" field: the commit that introduced the contribution
    //     advances by one when the contributor's own commit lands, so
    //     a pre-commit local generate disagrees with a post-commit CI
    //     generate. The regen workflow corrects drift on push to main.
    // The trust anchor is "sha256" (the content hash) — those are
    // compared and must match exactly. If contribution content changed,
    // sha256 changes, and --check correctly fails.
    const elide = (value: any): any => {
      if (Array.isArray(value)) return value.map(elide);
      if (value && typeof value === "object") {
        const out: any = {};
        for (const [k, v] of Object.entries(value)) {
          if (k === "generated_at" || k === "sha") out[k] = "<elided>";
          else out[k] = elide(v);
        }
        return out;
      }
      return value;
    };
    const a = JSON.stringify(elide(current));
    const b = JSON.stringify(elide(next));
    if (a !== b) {
      console.error("registry.json is out of date.");
      console.error("Run `bun run generate` and commit the result.");
      process.exit(1);
    }
    console.log("registry.json is up to date");
    return;
  }

  writeFileSync(REGISTRY_PATH, nextSerialized);
  console.log(
    `Wrote registry.json — ${next.themes.length} themes, ` +
      `${next.plugins.scm.length} scm, ` +
      `${next.plugins["env-provider"].length} env-provider, ` +
      `${next.plugins["language-grammar"].length} language-grammar`,
  );
}

main();
