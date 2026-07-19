import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // The Midnight SDK packages (compact-runtime, midnight-js-*) are
    // Node-first: they reference Buffer and Node core modules. Vite doesn't
    // polyfill any of that for a browser build by default.
    nodePolyfills({
      globals: { Buffer: true, global: true, process: true },
    }),
  ],
});
