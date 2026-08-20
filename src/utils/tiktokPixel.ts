// Type-safe helper to prevent any TypeScript compiler build failures

declare global {
  interface Window {
    ttq?: {
      track: (event: string, params?: Record<string, any>) => void;
      page: () => void;
    };
  }
}

export const trackTikTokEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window !== 'undefined' && window.ttq && typeof window.ttq.track === 'function') {
    try {
      window.ttq.track(eventName, params);
    } catch (err) {
      console.warn(`TikTok Pixel event ${eventName} failed:`, err);
    }
  }
};
