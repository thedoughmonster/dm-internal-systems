import { create } from "storybook/theming"

export const STORYBOOK_SURFACE = "hsl(232 42% 7%)"
export const STORYBOOK_CARD = "hsl(232 42% 9%)"
export const STORYBOOK_BORDER = "hsl(225 25% 20%)"
export const STORYBOOK_TEXT = "hsl(140 80% 85%)"

export const dmStorybookTheme = create({
  base: "dark",
  appBg: STORYBOOK_SURFACE,
  appContentBg: STORYBOOK_SURFACE,
  appPreviewBg: STORYBOOK_SURFACE,
  appBorderColor: STORYBOOK_BORDER,
  appBorderRadius: 8,
  colorPrimary: "hsl(140 85% 55%)",
  colorSecondary: "hsl(190 90% 55%)",
  textColor: STORYBOOK_TEXT,
  textInverseColor: STORYBOOK_SURFACE,
  barBg: STORYBOOK_CARD,
  barTextColor: STORYBOOK_TEXT,
  barSelectedColor: "hsl(140 85% 55%)",
  barHoverColor: "hsl(190 90% 55%)",
  inputBg: STORYBOOK_CARD,
  inputBorder: STORYBOOK_BORDER,
  inputTextColor: STORYBOOK_TEXT,
  inputBorderRadius: 8,
})
