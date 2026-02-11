<!-- apps/web/docs/contracts/ui-style-contract.md -->

# UI Style Contract

VERSION: v1.1  
STATUS: ACTIVE  
LAST_UPDATED: 2026-01-31  
SCOPE: apps/web UI styling and component usage  

## Purpose

This contract prevents styling drift by defining a single, repeatable set of layout and component rules derived from the UI kit page.

JSON is canonical. This file explains intent and provides human readable guidance.

## Core rules

1. Every page uses a centered main container with padding.
2. App background is applied once in the app shell using dm-app-bg.
3. UI is built from shadcn primitives and DM composites only.
4. No global element selectors restyle shadcn semantics.
5. Labels look like the UI kit, but via the Label component, not a global label selector.
6. Loading states do not move buttons or shift layout.

## Page layout

Default container:

- main: mx-auto w-full max-w-6xl p-6

If a page truly needs more width, it may use max-w-7xl, still centered and padded.

Page header actions:

- flex flex-wrap items-center gap-2

Page header meta text:

- flex flex-wrap items-center gap-2 text-xs text-muted-foreground

Section stack spacing:

- space-y-5

## Sections and cards

Preferred section wrapper matches the UI kit:

- rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm

Terminal panels use:

- rounded-2xl border border-border/60 bg-black/40 p-4

Card stacks use:

- space-y-4

## Labels and forms

Labels must be rendered with the shadcn Label component.

The label style should be implemented inside components/ui/label so it applies consistently while avoiding global CSS leakage.

Do not style label elements globally in globals.css.

If you need a mono label style, use:

- text-xs font-mono uppercase tracking-wide text-muted-foreground

Global element selectors already present are legacy and must not be expanded in new changes.

## Tables

Tables must use components/ui/table and sit inside a scroll container when wider than the viewport.

Table container:

- overflow-x-auto rounded-xl border border-border/60 bg-card/40

Table header:

- text-xs uppercase tracking-wide text-muted-foreground

Table row:

- border-b border-border/40

Table cell:

- p-3 align-top text-sm

Table cell mono:

- font-mono text-xs text-foreground/90

Table empty state text:

- text-sm text-muted-foreground

## Content blocks

Preformatted block:

- rounded-xl border border-border/60 bg-black/40 p-4 font-mono text-xs text-foreground/90 whitespace-pre-wrap

Muted body text:

- text-sm text-muted-foreground

Error text:

- text-sm text-destructive

## Interaction rules

- Buttons must keep stable width across loading and disabled states, use min width or consistent labels.
- JSON debug views must be hidden by default behind a secondary action or disclosure.

## Token integrity

If tailwind config references CSS variables, those variables must exist in the theme CSS.

If sidebar tokens are referenced, either define them in globals.css or remove the sidebar token mapping from tailwind config.

## Enforcement

When a page or component violates these rules, remediation is to:

- replace bespoke markup with shadcn primitives
- move style into the primitive component implementation or a DM composite
- remove page specific CSS and rely on the contract
