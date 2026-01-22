import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // ✅ env 로딩 (현재 실행 디렉토리 = stock-frontend)
  const env = loadEnv(mode, process.cwd(), "");

  const target = env.VITE_API_BASE_URL;

  // ✅ target 없으면 바로 죽여라 (지금 같은 삽질 방지용)
  if (!target) {
    throw new Error("VITE_API_BASE_URL is not defined");
  }

  return {
    plugins: [react()],
    server: {
      proxy: {
        // ✅ 도메인 단위로만 proxy (중요)
        "/api": { target, changeOrigin: true },
        // "/result": { target, changeOrigin: true },
        // "/indicator": { target, changeOrigin: true },
        // "/mystock": { target, changeOrigin: true },
        // "/myetf": { target, changeOrigin: true },
        // "/board": { target, changeOrigin: true },
        // "/stock": { target, changeOrigin: true },
        // "/nps": { target, changeOrigin: true },
        // "/common": { target, changeOrigin: true },
        // "/kodex": { target, changeOrigin: true },
        // "/bond": { target, changeOrigin: true },
        // "/issue": { target, changeOrigin: true },
        // "/dual-momentum": { target, changeOrigin: true }
      }
    }
  };
});
