#!/usr/bin/env bun
//
// Validates each contribution manifest against manifest.schema.json plus
// a few cross-cutting rules:
//
//   - manifest `name` (or theme `id`) matches the directory name
//   - manifest `kind` matches the kind directory it lives under
//   - license is in the v1 allowlist (enforced by the schema enum)
//   - manifest fields version + author + license are present
//
// Author existence on GitHub is intentionally NOT checked here — that
// would require a network call in CI and a PAT for rate limits. Land
// it in a follow-up if typo-squatting becomes a real problem.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import process from "node:process";
import Ajv2020, { type ValidateFunction } from "ajv/dist/2020";
import addFormats from "ajv-formats";

const REPO_ROOT = resolve(process.cwd());

const KIND_DIRS = [
  { dir: "themes", kind: "theme", manifestFile: "theme.json" },
  { dir: "plugins/scm", kind: "scm", manifestFile: "plugin.json" },
  {
    dir: "plugins/env-providers",
    kind: "env-provider",
    manifestFile: "plugin.json",
  },
  {
    dir: "plugins/language-grammars",
    kind: "language-grammar",
    manifestFile: "plugin.json",
  },
] as const;

function listContributions(dir: string): string[] {
  const abs = join(REPO_ROOT, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs)
    .filter((name) => !name.startsWith("_") && !name.startsWith("."))
    .map((name) => join(abs, name))
    .filter((p) => statSync(p).isDirectory());
}

function loadSchema(): ValidateFunction {
  const schema = JSON.parse(
    readFileSync(join(REPO_ROOT, "manifest.schema.json"), "utf-8"),
  );
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

type Issue = { path: string; message: string };

function validateContribution(
  absDir: string,
  kind: string,
  manifestFile: string,
  validate: ValidateFunction,
): Issue[] {
  const issues: Issue[] = [];
  const dirRel = relative(REPO_ROOT, absDir);
  const dirName = dirRel.split("/").pop()!;
  const manifestPath = join(absDir, manifestFile);

  if (!existsSync(manifestPath)) {
    issues.push({
      path: dirRel,
      message: `missing ${manifestFile}`,
    });
    return issues;
  }

  let manifest: any;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  } catch (e: any) {
    issues.push({
      path: dirRel,
      message: `${manifestFile} is not valid JSON: ${e.message}`,
    });
    return issues;
  }

  if (!validate(manifest)) {
    for (const err of validate.errors ?? []) {
      issues.push({
        path: dirRel,
        message: `${err.instancePath || "/"} ${err.message}`,
      });
    }
  }

  // Cross-cutting: name/id matches dir
  if (kind === "theme") {
    if (manifest.id !== dirName) {
      issues.push({
        path: dirRel,
        message: `theme id "${manifest.id}" must equal directory name "${dirName}"`,
      });
    }
  } else {
    if (manifest.name !== dirName) {
      issues.push({
        path: dirRel,
        message: `plugin name "${manifest.name}" must equal directory name "${dirName}"`,
      });
    }
    const declaredKind = manifest.kind ?? "scm";
    if (declaredKind !== kind) {
      issues.push({
        path: dirRel,
        message: `plugin kind "${declaredKind}" does not match directory kind "${kind}"`,
      });
    }
  }

  // language-grammar plugins must declare languages + grammars and the
  // referenced grammar files must exist and stay inside the directory.
  if (kind === "language-grammar") {
    if (!manifest.languages?.length) {
      issues.push({
        path: dirRel,
        message: "language-grammar plugin must declare at least one language",
      });
    }
    if (!manifest.grammars?.length) {
      issues.push({
        path: dirRel,
        message: "language-grammar plugin must declare at least one grammar",
      });
    }
    for (const g of manifest.grammars ?? []) {
      if (typeof g.path !== "string") continue;
      if (g.path.includes("..") || g.path.startsWith("/")) {
        issues.push({
          path: dirRel,
          message: `grammar path "${g.path}" must stay inside the plugin directory`,
        });
        continue;
      }
      const grammarFile = join(absDir, g.path);
      if (!existsSync(grammarFile)) {
        issues.push({
          path: dirRel,
          message: `grammar file "${g.path}" does not exist`,
        });
      }
    }
  }

  return issues;
}

function main() {
  const validate = loadSchema();
  const allIssues: Issue[] = [];
  let count = 0;

  for (const { dir, kind, manifestFile } of KIND_DIRS) {
    for (const absDir of listContributions(dir)) {
      count++;
      allIssues.push(
        ...validateContribution(absDir, kind, manifestFile, validate),
      );
    }
  }

  if (allIssues.length === 0) {
    console.log(`Validated ${count} contribution(s) — all OK`);
    return;
  }

  console.error(`Validation failed: ${allIssues.length} issue(s)\n`);
  for (const issue of allIssues) {
    console.error(`  ${issue.path}: ${issue.message}`);
  }
  process.exit(1);
}

main();
