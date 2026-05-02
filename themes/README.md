# Themes

Themes override Claudette's CSS custom properties. A theme is a single CSS block targeting `[data-theme="<your-id>"]` plus a small JSON manifest with display metadata.

## Manifest (`theme.json`)

```jsonc
{
  "id": "your-theme-id",          // kebab-case, must match the directory name and the [data-theme="..."] selector
  "name": "Your Theme",            // human-readable display name
  "description": "One-line tagline shown in the theme picker",
  "colorScheme": "dark",           // "dark" | "light" — drives Shiki light/dark variant selection
  "accentPreview": "#e07850"       // hex of --accent-primary, used for the swatch in the command palette
}
```

This mirrors `BuiltinThemeMeta` in [Claudette's `src/ui/src/styles/themes/index.ts`](https://github.com/utensils/Claudette/blob/main/src/ui/src/styles/themes/index.ts). New fields must be added there first.

## CSS (`theme.css`)

A single block of the form:

```css
[data-theme="your-theme-id"] {
  --accent-primary:      #e07850;
  --accent-primary-rgb:  224, 120, 80;
  --app-bg:              #1c1815;
  --text-primary:        #f0ebe5;
  /* ... full token set ... */
}
```

The full set of tokens Claudette consumes lives in [`src/ui/src/styles/theme.css`](https://github.com/utensils/Claudette/blob/main/src/ui/src/styles/theme.css). Use the `:root` block (which is the Default Dark theme) as your reference — every token defined there should be overridden in your theme block. Missing tokens fall back to Default Dark and produce a visually broken result.

### Tips

- Always set both `--accent-primary` and `--accent-primary-rgb` (the `rgba(var(--accent-primary-rgb), <alpha>)` pattern is used throughout Claudette for translucent layers).
- For light themes, set `colorScheme: "light"` — Claudette uses this to switch Shiki between its light and dark variants for code blocks.
- Don't define tokens outside `[data-theme="..."]` — global redefinitions break theme switching.

## Submitting

```sh
cp -r themes/_example themes/your-theme-id
$EDITOR themes/your-theme-id/{theme.json,theme.css}
```

Then open a PR. Maintainers apply the `theme` and `submission` labels.
