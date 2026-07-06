/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#0B0F19",      // 극소 저조도 다크 배경
          card: "#161C2C",    // 카드 및 패널 배경
          border: "#232D45",  // 테두리 선
          hover: "#1E263B"    // 호버 시 배경색
        }
      },
      animation: {
        'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
