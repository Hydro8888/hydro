FROM node:20-alpine AS builder
WORKDIR /app

# 의존성 먼저 복사 → 레이어 캐시 활용 (소스 변경 시 npm ci 재실행 안 함)
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
