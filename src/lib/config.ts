// Frontend configuration
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 
          (import.meta.env.MODE === 'production' 
            ? 'https://kalucuts.onrender.com'  // Production API
            : 'http://localhost:3000'         // Development API (through proxy)
          ),
  clientUrl: import.meta.env.VITE_CLIENT_URL || 
            (import.meta.env.MODE === 'production'
              ? 'https://bookingapp-gamma-orcin.vercel.app' // Production Client
              : 'http://localhost:8080'
            ),
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
