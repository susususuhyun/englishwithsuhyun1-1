import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// VITE_BASE_PATH is set by the GitHub Actions workflow to "/<repo-name>/"
// so assets resolve correctly on GitHub Pages (username.github.io/repo-name/).
// Locally it just falls back to "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || '/',
})
