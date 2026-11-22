/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

/* GitHub Pages 주소: https://<아이디>.github.io/dundeuni-gamebang/ → build 할 때 base 를 저장소 이름에 맞춤 */
const REPO = 'dundeuni-gamebang'
const BG = '#E3F4DA' // 파스텔 연두 (든든이 시리즈 바탕색)

export default defineConfig(({ command, isPreview }) => ({
  base: command === 'build' || isPreview ? `/${REPO}/` : '/',
  server: { host: true },
  /* 오래된 태블릿 브라우저(크롬 80·사파리 13.1 무렵)에서도 돌도록 최신 문법을 낮춰서 빌드 */
  build: { target: ['es2019', 'chrome79', 'safari13', 'edge79', 'firefox78'] },
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
  },
  plugins: [
    react(),
    /* PWA: 홈 화면에 추가 → 주소창 없이 전체 화면, 비행기 모드에서도 6개 게임 모두 실행 */
    VitePWA({
      registerType: 'prompt', // 새 버전은 게임방 메인에서만 적용 (kids-mode/UpdateWatcher.tsx)
      injectRegister: false,
      manifest: {
        id: './',
        name: '든든이 게임방',
        short_name: '든든이',
        description: '형제를 위한 든든이 교육 게임 모음',
        lang: 'ko',
        display: 'fullscreen',
        display_override: ['fullscreen', 'standalone'],
        orientation: 'any',
        background_color: BG,
        theme_color: BG,
        start_url: './',
        scope: './',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        /* 모든 게임의 그림·글꼴·코드를 미리 저장 (precache) */
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,json,txt}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/\/legacy\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { environment: 'node', include: ['src/**/*.test.ts'], setupFiles: ['src/test-setup.ts'] },
}))
