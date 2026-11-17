/**
 * Scrolling announcement shown above the home banner in the mobile app.
 * Stored as `settings/app.homeTickerText`; an empty value hides the strip.
 */
export const HOME_TICKER_MAX_LENGTH = 300;

/** Same speed as the app's ticker, so the dashboard preview moves like the real strip. */
export const HOME_TICKER_SPEED_PX_PER_SECOND = 40;

/** The ticker is a single line: newlines and repeated spaces collapse to one space. */
export function normalizeHomeTickerText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}
