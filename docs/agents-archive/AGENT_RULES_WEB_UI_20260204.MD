<!-- path: docs/AGENT_RULES_WEB_UI_V1.MD -->

# AGENT RULES WEB UI V1

VERSION: v1.0  
STATUS: ACTIVE  
SCOPE: Web UI work for dm-internal-systems  
LAST_UPDATED: 2026-02-03  
OWNER: Human Operator  

## Purpose

This document defines web UI specific rules and constraints.
It is the single source of truth for apps/web UI guidance.

## Required reading

- apps/web/README_COMPONENT_PARADIGM.md

## Repo reference

See `REPO_LINK.md` for the canonical repository URL and access guidance.

## Docs guidance

- Documentation governance and policy live at repo root.

## Goals

- Keep UI consistent across the app.
- Avoid one off components living next to pages unless they are composites.
- Make reuse cheap and obvious.
- Keep page folders clean and predictable.

## Core rules

1. Placement is required. Every new UI module must fit one category below.
2. Route scope is real. Anything in app routes is route scoped unless proven reusable.
3. Pages are thin. Pages should be wiring only, not heavy logic. Use composites to hold route specific logic.
4. Shared app APIs live in lib. Shared app API helpers must live under `apps/web/lib` and be imported via `@/lib/*`.
5. Route scoped `app/**/lib` modules must not be imported outside their route tree.

## Navigation rules

- Only direct child routes of `apps/web/app` with a `page.tsx` are eligible for the global top navigation.
- Every child directory that is intended to be or have any views must include a `page.tsx`.
- Route groups in parentheses, such as `(internal)`, are exempt from the page requirement.
- Dynamic route segments in brackets, such as `[session_id]`, are exempt from the page and composites placement rules.
- The `page.tsx` for a top level route is the landing page for the top navigation item.
- Child directories with a `page.tsx` must appear in the sidebar navigation under their top level parent.
- Sidebar navigation must only include directories that contain a `page.tsx`. Do not include `composites`, `lib`, or other non page folders.
- Flow views and supporting UI should live as siblings to `page.tsx` in `composites` and `lib`, never as additional route directories unless they are meant to appear in navigation.
- Navigation ordering is manual and defined in the navigation registry.
- Navigation labels must follow a consistent naming convention for display.
- Navigation registry lives in `apps/web/lib/navigation-registry.ts`.
- Navigation types live in `apps/web/lib/types/navigation.ts`.

## Categories and locations

### shadcn primitives

Location: `apps/web/components/ui/*`

What goes here: Unmodified shadcn primitives.

Rules:
- Do not add app specific logic here.
- Prefer composition in a DM component rather than editing shadcn directly.
- Only modify if the change is globally required and approved.

### DM reusable primitives

Location: `apps/web/components/ui/dm/*`

What goes here: Custom DM components that wire one or more shadcn primitives.

Rules:
- Must be reusable across multiple routes or feature areas.
- Must accept props and remain domain neutral.
- If the component is route specific, it does not belong here.

### Page scoped composites

Location: `apps/web/app/**/composites/*`

What goes here: Route scoped flows and wiring components that coordinate state, APIs, or multiple sections for a route.

Rules:
- A composite directory is always a sibling of the file that uses it.
- Do not promote to DM primitives unless it is reusable and neutral.

## Decision checklist

1. Is it an unmodified shadcn primitive. Use `components/ui/*`.
2. Is it reusable across multiple routes and mostly wiring plus presentation. Use `components/ui/dm/*`.
3. Is it a feature flow tied to a specific route or feature slice. Use `app/**/composites/*`.
4. If none apply, stop and clarify.

## Example tree

```text
apps/web/
  components/
    ui/
      button.tsx
      card.tsx
      dialog.tsx
      tooltip.tsx
      dm/
        file-picker.tsx
        terminal-block.tsx
  app/
    vendors/
      ingest/
        page.tsx
        composites/
          VendorIngestFlow.tsx
        lib/
          api.ts
          types.ts
```

## Enforcement

Lint enforces structural boundaries. See `apps/web/eslint.config.mjs` and `apps/web/lib/eslint`.

## Page structure rule

- `page.tsx` should be minimal.
- Prefer rendering a single composite component, for example `return <VendorIngestFlow />;`.

## UI primitive usage rule

- Raw HTML form elements are only allowed inside `apps/web/components/ui/*`.
- Outside `apps/web/components/ui/*`, forms must use components from `apps/web/components/ui/*` for inputs, selects, textareas, and buttons.
- Do not use plain HTML `input`, `select`, `textarea`, or `button` elements outside `apps/web/components/ui/*`.

## UI behavior rules

- Buttons must not shift position based on state.
- If an action is unavailable, keep the button in place and disable it.
- JSON buttons must be labeled by payload: Analyze JSON, Confirm JSON, or Audit JSON when applicable.

## Data access and analytics rules

- All UI reads and writes must go through Edge Functions.
- Do not call Supabase REST endpoints directly from UI code.
- SQL functions used by Edge Functions must be read only and compute results from existing tables.
- Do not persist derived analytics data in new tables unless explicitly approved.
- Do not introduce UI controls for environment switching or authentication in v0.
- Keep derived analytics vendor scoped until a shared ingredient mapping is available.
- Approved local exception: the `/directives` UI reads and writes `apps/web/.local/directives/` directly for local use only.

## Migration naming rules

- Migration filenames must use UTC timestamps in the format `YYYYMMDDhhmmss_description.sql`.
- Do not include `T` or `Z` in migration filenames.

## Style guides and constraints

- Read the `ui_style_contract.json` and `ui_style_contract.md` and adhere to principles therein.
