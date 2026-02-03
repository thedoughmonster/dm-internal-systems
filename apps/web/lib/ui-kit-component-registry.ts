export type UiKitComponent = {
  slug: string
  title: string
  description: string
}

export type UiKitComponentGroup = {
  id: string
  title: string
  components: UiKitComponent[]
}

export const componentGroups: UiKitComponentGroup[] = [
  {
    id: "data-display",
    title: "Data Display",
    components: [
      {
        slug: "calendar",
        title: "Calendar",
        description: "Date pickers and date views.",
      },
      {
        slug: "card",
        title: "Card",
        description: "Content containers with headers and footers.",
      },
      {
        slug: "carousel",
        title: "Carousel",
        description: "Scrollable slides and content carousels.",
      },
      {
        slug: "chart",
        title: "Chart",
        description: "Data visualizations and chart containers.",
      },
      {
        slug: "progress",
        title: "Progress",
        description: "Progress indicators and bars.",
      },
      {
        slug: "table",
        title: "Table",
        description: "Data tables and row layouts.",
      },
    ],
  },
  {
    id: "feedback",
    title: "Feedback",
    components: [
      {
        slug: "alert",
        title: "Alert",
        description: "Status messaging and callouts.",
      },
      {
        slug: "empty",
        title: "Empty",
        description: "Empty state messaging.",
      },
      {
        slug: "loader",
        title: "Loader",
        description: "Loading indicators and spinners.",
      },
      {
        slug: "skeleton",
        title: "Skeleton",
        description: "Loading placeholders.",
      },
      {
        slug: "sonner",
        title: "Sonner",
        description: "Toast notifications.",
      },
      {
        slug: "spinner",
        title: "Spinner",
        description: "Simple loading spinner.",
      },
    ],
  },
  {
    id: "layout",
    title: "Layout",
    components: [
      {
        slug: "accordion",
        title: "Accordion",
        description: "Expandable content panels.",
      },
      {
        slug: "collapsible",
        title: "Collapsible",
        description: "Hide and show content blocks.",
      },
      {
        slug: "resizable",
        title: "Resizable",
        description: "Resizable panel layouts.",
      },
      {
        slug: "scroll-area",
        title: "Scroll Area",
        description: "Custom scroll containers.",
      },
      {
        slug: "sidebar",
        title: "Sidebar",
        description: "Application side navigation.",
      },
    ],
  },
  {
    id: "navigation",
    title: "Navigation",
    components: [
      {
        slug: "breadcrumb",
        title: "Breadcrumb",
        description: "Hierarchical navigation trails.",
      },
      {
        slug: "menubar",
        title: "Menubar",
        description: "Desktop style application menus.",
      },
      {
        slug: "navigation-menu",
        title: "Navigation Menu",
        description: "Primary navigation menus with flyouts.",
      },
      {
        slug: "tabs",
        title: "Tabs",
        description: "Tabbed navigation between views.",
      },
    ],
  },
  {
    id: "forms",
    title: "Forms",
    components: [
      {
        slug: "checkbox",
        title: "Checkbox",
        description: "Binary choice inputs.",
      },
      {
        slug: "field",
        title: "Field",
        description: "Form field wrappers and layouts.",
      },
      {
        slug: "form",
        title: "Form",
        description: "Form primitives and validation helpers.",
      },
      {
        slug: "input",
        title: "Input",
        description: "Text inputs and variants.",
      },
      {
        slug: "input-group",
        title: "Input Group",
        description: "Grouped inputs with addons.",
      },
      {
        slug: "input-otp",
        title: "Input OTP",
        description: "One time passcode entry.",
      },
      {
        slug: "radio-group",
        title: "Radio Group",
        description: "Single choice selection lists.",
      },
      {
        slug: "select",
        title: "Select",
        description: "Dropdown selects for choices.",
      },
      {
        slug: "slider",
        title: "Slider",
        description: "Range and value sliders.",
      },
      {
        slug: "switch",
        title: "Switch",
        description: "Toggle switches for state.",
      },
      {
        slug: "textarea",
        title: "Textarea",
        description: "Multi line text inputs.",
      },
    ],
  },
  {
    id: "overlays",
    title: "Overlays",
    components: [
      {
        slug: "alert-dialog",
        title: "Alert Dialog",
        description: "Modal confirmations for critical actions.",
      },
      {
        slug: "command",
        title: "Command",
        description: "Command palette search surfaces.",
      },
      {
        slug: "context-menu",
        title: "Context Menu",
        description: "Right click context actions.",
      },
      {
        slug: "dialog",
        title: "Dialog",
        description: "Modal dialogs for forms and content.",
      },
      {
        slug: "drawer",
        title: "Drawer",
        description: "Slide up panels for mobile actions.",
      },
      {
        slug: "dropdown-menu",
        title: "Dropdown Menu",
        description: "Dropdown lists for quick actions.",
      },
      {
        slug: "hover-card",
        title: "Hover Card",
        description: "Hover triggered previews.",
      },
      {
        slug: "popover",
        title: "Popover",
        description: "Popover containers for lightweight content.",
      },
      {
        slug: "sheet",
        title: "Sheet",
        description: "Side panels for settings and details.",
      },
      {
        slug: "tooltip",
        title: "Tooltip",
        description: "Contextual hints on hover or focus.",
      },
    ],
  },
  {
    id: "foundations",
    title: "Foundations",
    components: [
      {
        slug: "aspect-ratio",
        title: "Aspect Ratio",
        description: "Media containers with preserved proportions.",
      },
      {
        slug: "avatar",
        title: "Avatar",
        description: "User identity thumbnails and fallbacks.",
      },
      {
        slug: "badge",
        title: "Badge",
        description: "Small status and category indicators.",
      },
      {
        slug: "item",
        title: "Item",
        description: "Compact list row building blocks.",
      },
      {
        slug: "kbd",
        title: "Kbd",
        description: "Keyboard shortcut labels.",
      },
      {
        slug: "label",
        title: "Label",
        description: "Inline text labels for inputs.",
      },
      {
        slug: "separator",
        title: "Separator",
        description: "Dividers for grouping content.",
      },
    ],
  },
  {
    id: "dm-composites",
    title: "DM Composites",
    components: [
      {
        slug: "file-picker",
        title: "File Picker",
        description: "Single file upload composite.",
      },
      {
        slug: "multi-file-picker",
        title: "Multi File Picker",
        description: "Multi file upload composite.",
      },
    ],
  },
  {
    id: "actions",
    title: "Actions",
    components: [
      {
        slug: "button",
        title: "Button",
        description: "Primary and secondary call to action buttons.",
      },
      {
        slug: "button-group",
        title: "Button Group",
        description: "Grouped button clusters for related actions.",
      },
      {
        slug: "pagination",
        title: "Pagination",
        description: "Page navigation controls.",
      },
      {
        slug: "toggle",
        title: "Toggle",
        description: "Single toggle button states.",
      },
      {
        slug: "toggle-group",
        title: "Toggle Group",
        description: "Grouped toggle buttons for selections.",
      },
    ],
  },
]

export const componentLookup = componentGroups.reduce<Record<string, UiKitComponent>>(
  (acc, group) => {
    group.components.forEach((component) => {
      acc[component.slug] = component
    })
    return acc
  },
  {}
)

export const componentSlugs = componentGroups.flatMap((group) =>
  group.components.map((component) => component.slug)
)

export function getComponentBySlug(slug: string) {
  return componentLookup[slug] ?? null
}
