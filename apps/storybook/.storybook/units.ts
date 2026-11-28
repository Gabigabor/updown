// Sizes are px in the token JSON (Figma works in px) and rem in CSS (16px = 1rem, the browser
// default). Storybook shows the rem value first, the px equivalent in brackets.
export const REM_BASE = 16;

/** "1.5rem" -> "1.5rem (24px)"; other values (colours, var(), calc) are returned unchanged. */
export const withPx = (value?: string) =>
  (value ?? '').replace(/(-?\d*\.?\d+)rem\b/g, (_, n: string) => {
    const px = Math.round(Number(n) * REM_BASE * 100) / 100;
    return `${n}rem (${px}px)`;
  });
