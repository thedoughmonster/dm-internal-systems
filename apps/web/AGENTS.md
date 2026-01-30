
```md
<!-- apps/web/AGENTS.md -->

# Agents rules for UI work

## Component placement paradigm

- `apps/web/components/ui/*`
  - shadcn primitives only
  - no app specific logic
  - no imports from `apps/web/app/*`

- `apps/web/components/ui/dm/*`
  - DM reusable primitives built by wiring shadcn components together
  - must be reusable
  - must not import from `apps/web/app/*`
  - should stay domain neutral and be driven by props

- `apps/web/app/**/composites/*`
  - page scoped composites that wire primitives together into a feature flow
  - composites are allowed to call feature APIs and coordinate state
  - composites directories are only ever siblings of the file that uses them
  - do not create `components/` folders as siblings to pages
  - do not promote a composite unless it can be named generically and reused

## Page structure rule

- `page.tsx` should be minimal.
- Prefer rendering a single composite component, for example:
  - `return <VendorIngestFlow />;`

## UI primitive usage rule

- Forms must use components from `apps/web/components/ui/*` for inputs, selects, textareas, and buttons.
- Do not use plain HTML `input`, `select`, `textarea`, or `button` elements.

## UI behavior rules

- Buttons must not shift position based on state.
- If an action is unavailable, keep the button in place and disable it.
- JSON buttons must be labeled by payload:
  - Analyze JSON
  - Confirm JSON
  - Audit JSON (if applicable)
