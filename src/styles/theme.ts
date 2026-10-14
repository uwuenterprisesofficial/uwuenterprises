/** Static palette for components that still style inline (gallery, puzzle). */
export const theme = {
  bg:         '#2a1245',
  surface:    '#3b1d63',
  surfaceAlt: '#4a2578',
  pink:       '#ff6fae',
  pinkGlow:   '#ff6fae55',
  lilac:      '#c9a7ff',
  lilacDim:   '#c9a7ff33',
  white:      '#fff2fa',
  muted:      '#cdb6ea',
  border:     '#5b3a8a',

  fontDisplay: "'Bagel Fat One', system-ui, sans-serif",
  fontBody:    "'Nunito', system-ui, sans-serif",
} as const;

export type Theme = typeof theme;
export default theme;
