import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Single source of truth for the public site URL (OG tags in index.html via
  // %VITE_SITE_URL%, and import.meta.env.VITE_SITE_URL in the app).
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  process.env.VITE_SITE_URL = (env.VITE_SITE_URL || 'https://fact-stamp.vercel.app').replace(/\/+$/, '')

  return {
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 100,
    },
    hmr: {
      clientPort: 5174,
    },
    // Security headers for dev server (mirrors production firebase.json headers)
    headers: {
      'X-Frame-Options': 'DENY',
      'Content-Security-Policy': "frame-ancestors 'none'",
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    },
  },
  optimizeDeps: {
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // firebase/storage is intentionally absent: it is imported dynamically
          // by uploadClaimScreenshot(), and naming it here would pull it back
          // into the eager vendor chunk every visitor downloads.
          'vendor-firebase': ['firebase/app', 'firebase/app-check', 'firebase/auth', 'firebase/firestore'],
          'vendor-ui': ['lucide-react', 'framer-motion'],
          // recharts, html-to-image and tesseract.js are deliberately NOT named
          // here: they are only reached from lazy routes, and a named manual
          // chunk gets an eager <link rel=modulepreload> in index.html.
        },
      },
    },
  },
}
})
