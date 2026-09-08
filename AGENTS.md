# Repository Guidelines

- Generic and shared helpers live in `/src/lib/utils`, grouped by concern where useful (for example `formatting`, `media`, and `stats`).
- Feature-owned behavior lives beside its feature. Server infrastructure lives in `/src/lib/server/core`; frontend presentation and browser integrations live in `/src/lib/client`.
- Shared media definitions own media characteristics and allowed statuses; server definitions own persistence, ingestion, and editable-field policy. Keep server dependencies out of shared definitions and utilities.
- Keep tests beside their modules and use direct imports when moving code; do not leave forwarding modules at the old paths.
- Do not build the project unless explicitly asked.
- Create tests only when they are necessary.
- Avoid creating functions that are used only once when possible. First look for an existing function that already works or can be lightly
  modified to support the use case.
- Do not use overly defensive programming. Add checks where necessary; otherwise, trust the types.
- Prefer the smallest change that fixes the root cause. Do not add fallback logic when an enforced data invariant is enough.
- After creating the feature, fix, refactor, etc. give me the name of the commit using a conventional commit message.
