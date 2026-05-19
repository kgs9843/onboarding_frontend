# --- 1단계: Node.js 환경에서 React 소스코드 빌드하기 ---
FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 파일 복사 및 설치
COPY package*.json ./
RUN npm ci

# 소스코드 전체 복사 및 Vite 빌드 실행
COPY . .
RUN npm run build

# --- 2단계: 경량화된 Nginx에 빌드 파일과 conf 심기 ---
FROM nginx:alpine

# ① 내 custom conf 파일을 도커 내부 Nginx 설정 방에 덮어쓰기
COPY default.conf /etc/nginx/conf.d/default.conf

# ② 1단계 builder에서 완성된 dist 폴더의 알맹이들을 도커 Nginx 창고로 수송
COPY --from=builder /app/dist /usr/share/nginx/html

# 80번 포트 개방 선언
EXPOSE 80

# Nginx 백그라운드 구동
CMD ["nginx", "-g", "daemon off;"]