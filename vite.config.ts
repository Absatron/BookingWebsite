import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Only use proxy in development mode
    ...(mode === 'development' && {
      proxy: {
        // Proxy API requests to the backend server (development only)
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
          // Keep the /api prefix since backend expects it
        },
      },
    }),
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
