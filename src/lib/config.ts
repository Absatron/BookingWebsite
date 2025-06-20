// Frontend configuration
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  clientUrl: import.meta.env.VITE_CLIENT_URL || 'http://localhost:8080',
};

// Debug logging in development
if (import.meta.env.DEV) {
  console.log('🔧 Frontend Config:', config);
  console.log('🌍 Environment variables:', {
    VITE_API_URL: import.meta.env.VITE_API_URL,
    VITE_CLIENT_URL: import.meta.env.VITE_CLIENT_URL,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
  });
}
