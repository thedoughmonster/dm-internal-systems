<!-- docs/canon/UI_STYLE_CONTRACT.MD -->

# UI Style Contract

VERSION: v1.0  
STATUS: ACTIVE  
LAST_UPDATED: 2026-01-30  
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

## Sections and cards

Preferred section wrapper matches the UI kit:

- rounded-2xl border border-border/60 bg-card/40 p-5 shadow-sm

Terminal panels use:

- rounded-2xl border border-border/60 bg-black/40 p-4

## Labels and forms

Labels must be rendered with the shadcn Label component.

The label style should be implemented inside components/ui/label so it applies consistently while avoiding global CSS leakage.

Do not style label elements globally in globals.css.

## Token integrity

If tailwind config references CSS variables, those variables must exist in the theme CSS.

If sidebar tokens are referenced, either define them in globals.css or remove the sidebar token mapping from tailwind config.

## Enforcement

When a page or component violates these rules, remediation is to:

- replace bespoke markup with shadcn primitives
- move style into the primitive component implementation or a DM composite
- remove page specific CSS and rely on the contract
