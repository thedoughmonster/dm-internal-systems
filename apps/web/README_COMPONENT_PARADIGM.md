<!-- apps/web/README_COMPONENT_PARADIGM.md -->

# DM UI Component Paradigm

This repo uses shadcn and Tailwind for primitives, then builds DM specific primitives, then composes page scoped flows.

## Goals

- Keep the UI consistent across the app.
- Avoid one off components living next to pages.
- Make reuse cheap and obvious.
- Keep page folders clean and predictable.

## Directory rules

### 1) shadcn primitives

Location:
- `apps/web/components/ui/*`

What goes here:
- Unmodified shadcn primitives (button, card, dialog, tooltip, etc).

Rules:
- Do not add app specific logic here.
- If a change is required, prefer composition in a DM component rather than editing shadcn directly.

### 2) DM reusable primitives

Location:
- `apps/web/components/ui/dm/*`

What goes here:
- Custom DM components that wire together one or more `components/ui` primitives into a reusable unit.
- Examples:
  - `DmFilePicker`
  - `DmTerminalBlock`
  - `DmKeyValueRow`
  - `DmStatusBadge`

Rules:
- Must be reusable across multiple pages or feature areas.
- Must not import from `app/*` routes.
- Should accept props and remain domain neutral.

### 3) Page scoped composites

Location:
- `apps/web/app/**/composites/*`

What goes here:
- Wired flows that are specific to a route or feature slice.
- These are allowed to import domain APIs, feature types, and DM primitives.
- Examples:
  - `VendorIngestFlow`
  - `CurbsideCheckinFlow`

Rules:
- Composites are scoped to the route tree where they live.
- A composite directory is always a sibling of the file that uses it.
- Composites should not be promoted to `components/ui/dm` unless you can name it generically and reuse it elsewhere.

## Decision checklist

When creating UI code, decide placement like this:

1. Is it already a shadcn component
- Use `components/ui/*`

2. Is it reusable across pages and mostly wiring plus presentation
- Create a DM component in `components/ui/dm/*`

3. Is it a feature flow tied to a specific route, calling APIs, coordinating state, rendering multiple sections
- Put it in `app/**/composites/*`

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
## Import rules

1. DM primitives import only from:
- @/components/ui/*
- @/components/ui/dm/*
- @/lib/*

2. Composites may import from:
- @/components/ui/*
- @/components/ui/dm/*
- local ./lib/*
- local ./composites/*

3. Pages should be thin:
- render a single composite when the page is a flow
- no complex state management inside page.tsx
