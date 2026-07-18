import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: change this to your GitHub repo name before deploying, e.g. '/eduplatform/'
// This is needed so assets load correctly at https://<username>.github.io/<repo-name>/
export default defineConfig({
  plugins: [react()],
  base: '/englishwithsuhyun1-1/',
})
