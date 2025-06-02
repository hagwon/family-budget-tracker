import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/family-budget-tracker/', // GitHub Pages용 경로 설정
  build: {
    outDir: 'dist',
  },
})