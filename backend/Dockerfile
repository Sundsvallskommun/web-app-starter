FROM node:24-slim AS base

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

FROM base AS dependencies

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --non-interactive

FROM dependencies AS builder

COPY . .
RUN yarn build

FROM base AS production-dependencies

ENV NODE_ENV=production

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --production=true --non-interactive \
  && yarn cache clean

FROM base AS runner

ENV NODE_ENV=production \
  PORT=3000

COPY --from=production-dependencies --chown=root:root /app/node_modules ./node_modules
COPY --from=builder --chown=root:root /app/dist ./dist
COPY --chown=root:root package.json ./package.json

# OpenShift assigns an arbitrary UID that is a member of group 0. Keep the
# application read-only and grant that group write access only to runtime data.
RUN mkdir -p /app/data/logs /app/data/sessions \
  && chown -R node:root /app/data \
  && chmod -R g=u /app/data

USER node

EXPOSE 3000

CMD ["node", "./dist/server.js"]
