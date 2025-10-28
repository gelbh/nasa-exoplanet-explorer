import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  
  build: {
    // Code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'three-vendor': ['three'],
          // Separate Three.js add-ons
          'three-addons': [
            'three/examples/jsm/controls/OrbitControls',
            'three/examples/jsm/postprocessing/EffectComposer',
            'three/examples/jsm/postprocessing/RenderPass',
            'three/examples/jsm/postprocessing/UnrealBloomPass',
          ],
        },
      },
    },
    
    // Optimize chunk size
    chunkSizeWarningLimit: 1000,
    
    // Source maps for production debugging (can be disabled for smaller bundles)
    sourcemap: false,
    
    // Minification
    minify: 'esbuild',
    
    // Target modern browsers for smaller bundle
    target: 'es2020',
  },
  
  // Optimize dependencies
  optimizeDeps: {
    include: ['react', 'react-dom', 'three'],
    exclude: [],
  },
  
  // Performance optimizations
  server: {
    hmr: {
      overlay: true,
    },
  },
})
