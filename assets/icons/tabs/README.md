# Native tab icons

These PNGs rasterize the `home`, `clock`, `send`, and `user` paths already used by `src/components/icons/gravity-icon.tsx`. They preserve the app's current icon design for native tab bars, which accept image sources rather than arbitrary SVG React elements.

Each icon is 24 logical pixels with `@2x` and `@3x` variants. The white glyph is a template mask; the native navigator applies the selected/unselected theme color. Regenerate these assets if the corresponding GravityIcon paths change.
