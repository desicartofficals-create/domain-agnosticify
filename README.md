# Domain Agnosticify

The codebase works perfectly on my old domain (desicart.xyz), but it throws 500 internal server errors for all assets on the new domain (desicartshop.com). 

This is because the old domain name (desicart.xyz) or its absolute URL is hardcoded somewhere in our Vite build settings, framework config, base asset paths, or environment variables (.env).

Please make the following changes to make the codebase domain-agnostic:

1. Scan the configuration files (like nuxt.config, vite.config, or framework environment files) and completely remove any hardcoded absolute references to 'desicart.xyz'.

2. Switch all asset URLs, script paths, and styling sheet link tags to use strict relative paths (e.g., '/_nuxt/' or '/assets/') rather than absolute URLs.

3. If an absolute base URL is required by the Nitro server, configure it to dynamically look up the current request hostname (using the native request headers) instead of using a hardcoded string.

4. Ensure all deployment guardrails are maintained so it builds cleanly for the Hostinger Node.js setup.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/d40affd9-cbc6-4544-9e76-dd6cd30e2a2f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
