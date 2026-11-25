FROM node:24-alpine AS base
WORKDIR /app

# Install build dependencies
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --include=dev

# Build Next.js
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_ADMIN_WA_NUMBER
ENV NEXT_PUBLIC_ADMIN_WA_NUMBER=${NEXT_PUBLIC_ADMIN_WA_NUMBER}
RUN npm run build

# Install dependencies for scripts run in the container
FROM base AS seed-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Run the production app
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 --ingroup nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=seed-deps /app/node_modules ./scripts/node_modules

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]