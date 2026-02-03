<!-- apps/web/README_COMPONENT_PARADIGM.md -->

# DM UI Component Paradigm

This repo uses shadcn and Tailwind for primitives, then builds DM specific primitives, then composes page scoped flows.
This document is mandatory. Every session must read it before changes are made.

## Goals

- Keep UI consistent across the app.
- Avoid one off components living next to pages unless they are composites.
- Make reuse cheap and obvious.
- Keep page folders clean and predictable.

## Core rules

These rules are strict. If any rule conflicts with a request, stop and clarify.

1) Placement is required
- Every new UI module must fit one category below.
- If it does not, stop and ask where it belongs.

2) Imports are restricted
- Do not import from forbidden paths for the category.
- If a required import is forbidden, the module must move categories.

3) Route scope is real
- Anything in app routes is route scoped unless proven reusable.
- Reusability requires use across multiple routes and a neutral name.

4) Pages are thin
- Pages should be wiring only, not heavy logic.
- Use composites to hold route specific logic.

5) Shared app APIs live in lib
- Shared app API helpers must live under `apps/web/lib` and be imported via `@/lib/*`.
- Route scoped `app/**/lib` modules must not be imported outside their route tree.

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

### 1) shadcn primitives

Location:
- `apps/web/components/ui/*`

What goes here:
- Unmodified shadcn primitives.

Rules:
- Do not add app specific logic here.
- Prefer composition in a DM component rather than editing shadcn directly.
- Only modify if the change is globally required and approved.

Allowed imports:
- `@/components/ui/*`
- `@/lib/*`

Forbidden imports:
- `@/app/*`
- `@/components/ui/dm/*`

### 2) DM reusable primitives

Location:
- `apps/web/components/ui/dm/*`

What goes here:
- Custom DM components that wire one or more shadcn primitives.
- Must be reusable across multiple routes or feature areas.

Rules:
- Must not import from `app/*`.
- Must accept props and remain domain neutral.
- If the component is route specific, it does not belong here.

Allowed imports:
- `@/components/ui/*`
- `@/components/ui/dm/*`
- `@/lib/*`

Forbidden imports:
- `@/app/*`

### 3) Page scoped composites

Location:
- `apps/web/app/**/composites/*`

What goes here:
- Route scoped flows and wiring.
- Components that coordinate state, APIs, or multiple sections for a route.

Rules:
- A composite directory is always a sibling of the file that uses it.
- Do not promote to DM primitives unless it is reusable and neutral.

Allowed imports:
- `@/components/ui/*`
- `@/components/ui/dm/*`
- `@/lib/*`
- local `./lib/*`
- local `./composites/*`

Forbidden imports:
- Imports from other route trees unless explicitly approved.

## Decision checklist

Use this checklist before creating or moving any UI code.

1) Is it an unmodified shadcn primitive
- Use `components/ui/*`

2) Is it reusable across multiple routes and mostly wiring plus presentation
- Use `components/ui/dm/*`

3) Is it a feature flow tied to a specific route or feature slice
- Use `app/**/composites/*`

If none apply, stop and clarify.

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

## Enforcement steps

When a new file or change is proposed:
1) Identify category.
2) Verify location.
3) Verify imports.
4) If any step fails, stop and ask for direction.

## Import boundary summary

- `components/ui/*` must not import from `app/*` or `components/ui/dm/*`.
- `components/ui/dm/*` must not import from `app/*`.
- `app/**/composites/*` may import from UI and local app libs.
