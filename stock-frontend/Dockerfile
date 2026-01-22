# ===============================
# Frontend (Vite - Dev)
# ===============================
FROM node:20-alpine

# 작업 디렉토리
WORKDIR /app

# package 파일 먼저 복사 (캐시 활용)
COPY package*.json ./

# 의존성 설치
RUN npm install

# 소스 복사
COPY . .

# Vite dev server 포트
EXPOSE 5173

# Vite dev 실행 (docker mode)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--mode", "docker"]
