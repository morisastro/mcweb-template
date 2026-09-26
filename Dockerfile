FROM node:20-alpine AS base

# Install OpenSSL for Prisma + argon2 native build deps
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm install --legacy-peer-deps || npm install

# Build
COPY . .
RUN npx prisma generate
RUN npm run build

# Production image
FROM node:20-alpine AS runner
RUN apk add --no-cache openssl libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=base /app /app

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Run schema sync then start (db push creates/syncs schema idempotently)
CMD ["sh", "-c", "npx prisma db push --skip-generate && npm run start"]
