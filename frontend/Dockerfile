FROM node:24-slim AS dependencies

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive

FROM node:24-slim AS builder

WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Next.js embeds public values and middleware-envs.js at build time. Require
# deployment-specific public values instead of copying localhost defaults.
ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_API_URL
ARG DOMAIN_NAME
ARG BASE_PATH
ARG NEXT_PUBLIC_BASE_PATH
ARG ADMIN_URL
ARG NEXT_PUBLIC_PROTECTED_ROUTES

ENV NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME}" \
  NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
  DOMAIN_NAME="${DOMAIN_NAME}" \
  BASE_PATH="${BASE_PATH}" \
  NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH}" \
  ADMIN_URL="${ADMIN_URL}" \
  NEXT_PUBLIC_PROTECTED_ROUTES="${NEXT_PUBLIC_PROTECTED_ROUTES}" \
  NEXT_TELEMETRY_DISABLED=1

RUN : "${NEXT_PUBLIC_APP_NAME:?Pass NEXT_PUBLIC_APP_NAME as a build argument}" \
  && : "${NEXT_PUBLIC_API_URL:?Pass NEXT_PUBLIC_API_URL as a build argument}" \
  && HEALTH_AUTH=false HEALTH_USERNAME="" HEALTH_PASSWORD="" yarn build

FROM node:24-slim AS runner

WORKDIR /app

ARG NEXT_PUBLIC_APP_NAME
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BASE_PATH

ENV NODE_ENV=production \
  HOSTNAME=0.0.0.0 \
  NEXT_PUBLIC_APP_NAME="${NEXT_PUBLIC_APP_NAME}" \
  NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL}" \
  NEXT_PUBLIC_BASE_PATH="${NEXT_PUBLIC_BASE_PATH}" \
  NEXT_TELEMETRY_DISABLED=1 \
  PORT=3000

COPY --from=builder --chown=root:root /app/public ./public
COPY --from=builder --chown=root:root /app/.next/standalone ./
COPY --from=builder --chown=root:root /app/.next/static ./.next/static

# Next's image and incremental caches are the only writable frontend paths.
RUN mkdir -p /app/.next/cache \
  && chown -R node:root /app/.next/cache \
  && chmod -R g=u /app/.next/cache

USER node

EXPOSE 3000

CMD ["node", "server.js"]
