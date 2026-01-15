import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      /* =========================
         AUTH / 공통 API
         ========================= */
      "/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/api/manage": {
        target: "http://localhost:8090",
        changeOrigin: true,
      },
      /* =========================
         전략 결과 API (NEW)
         ========================= */
      "/result/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },

      /* =========================
         MyStock API ✅ 추가
         ========================= */
      "/mystock/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },

      /* =========================
      MyEtf API ✅
      ========================= */
      "/myetf/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },

      /* =========================
         기존 도메인별 API
         ========================= */
      "/board": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/stock/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/nps/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/common/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/kodex/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/indicator/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/bond/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/issue/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      },
      "/dual-momentum/api": {
        target: "http://localhost:8090",
        changeOrigin: true
      }
    }
  }
});
