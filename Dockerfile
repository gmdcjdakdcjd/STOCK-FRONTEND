# 1단계: 빌드 환경 설정
FROM node:20-alpine AS build

# 작업 디렉토리 설정
WORKDIR /app

# 의존성 정의 파일 복사 및 설치
COPY package*.json ./
RUN npm ci

# 소스 코드 복사 및 빌드 진행
COPY . .
RUN npm run build

# 2단계: Nginx 가동 환경 설정
FROM nginx:alpine

# Nginx 기본 설정 파일 삭제 및 사용자 설정 복사
RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 빌드 산출물을 Nginx 정적 폴더로 복사
COPY --from=build /app/dist /usr/share/nginx/html

# 80 포트 노출 및 백그라운드 구동
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
