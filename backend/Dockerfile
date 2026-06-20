FROM node:18-alpine AS builder
WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --production=false || npm install

# Copy source and build
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./
COPY --from=builder /app/package-lock.json* ./
RUN npm ci --production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/uploads ./uploads

EXPOSE 4000
CMD ["node", "dist/server.js"]
