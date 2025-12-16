import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Chunk size optimalisatie
    rollupOptions: {
      output: {
        manualChunks: {
          // Supabase in aparte chunk
          'supabase': ['@supabase/supabase-js'],
          // React libraries in aparte chunk
          'react-vendor': ['react', 'react-dom'],
          // Lucide icons in aparte chunk
          'icons': ['lucide-react']
        }
      }
    },
    // Minificatie opties
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Verwijder console.logs in production
        drop_debugger: true,
        passes: 2
      },
      mangle: true,
      format: {
        comments: false
      }
    },
    // Source maps alleen in dev
    sourcemap: false,
    // Report compressed size
    reportCompressedSize: false,
    // Bigger chunk warning threshold
    chunkSizeWarningLimit: 1000
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', '@supabase/supabase-js', 'lucide-react']
  }
})
