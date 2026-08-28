// Type-safe, ad-blocker-safe Meta (Facebook) Pixel helper.
// Never throws — all calls fail silently if the pixel is blocked or missing.

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: unknown;
  }
}

const hasPixel = () =>
  typeof window !== "undefined" && typeof window.fbq === "function";

export const trackMetaEvent = (
  eventName: string,
  payload?: Record<string, any>,
) => {
  if (!hasPixel()) return;
  try {
    window.fbq!("track", eventName, payload);
  } catch (err) {
    console.warn(`Meta Pixel event ${eventName} failed:`, err);
  }
};

export const trackMetaCustomEvent = (
  eventName: string,
  payload?: Record<string, any>,
) => {
  if (!hasPixel()) return;
  try {
    window.fbq!("trackCustom", eventName, payload);
  } catch (err) {
    console.warn(`Meta Pixel custom event ${eventName} failed:`, err);
  }
};

export const trackMetaClick = (element: string, payload?: Record<string, any>) =>
  trackMetaCustomEvent("Click", { element, ...payload });

export {};
