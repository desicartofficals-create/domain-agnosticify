// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
export default defineConfig({
  // Domain-agnostic build: every emitted asset/script/stylesheet URL is a
  // root-relative path ("/assets/..."), never an absolute URL tied to a
  // specific hostname. This lets the same dist/ run on any domain.
  vite: {
    base: "/",
    environments: {
      client: {
        build: {
          rollupOptions: {
            output: {
              // Split heavy third-party libs out of the initial entry chunk so the
              // first paint only downloads React + the homepage code.
              manualChunks(id: string) {
                if (!id.includes("node_modules")) return;
                if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
                if (id.includes("lucide-react")) return "vendor-icons";
                if (id.includes("@supabase")) return "vendor-supabase";
                if (id.includes("@radix-ui") || id.includes("cmdk") || id.includes("vaul")) return "vendor-ui";
                if (id.includes("embla-carousel") || id.includes("react-day-picker") || id.includes("date-fns")) return "vendor-misc";
                return;
              },
            },
          },
        },
      },
    },
  },
});
