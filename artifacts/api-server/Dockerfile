FROM node:24-bookworm AS base
WORKDIR /repo
RUN corepack enable
COPY . .

FROM base AS deps
ENV CI=true
RUN corepack enable && corepack pnpm config set fetch-timeout 600000 && corepack pnpm config set fetch-retries 5 && corepack pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /repo/artifacts/api-server
RUN corepack pnpm run db:generate
RUN corepack pnpm run build

FROM node:24-bookworm AS runtime
WORKDIR /repo/artifacts/api-server
ENV NODE_ENV=production

# Install C, C++, Python, and Java compilers/runtimes
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g' /etc/apt/sources.list.d/debian.sources \
    && apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3 \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /repo/node_modules /repo/node_modules
COPY --from=build /repo/artifacts/api-server/dist ./dist
COPY --from=build /repo/artifacts/api-server/prisma ./prisma
COPY --from=build /repo/artifacts/api-server/package.json ./package.json
COPY --from=build /repo/artifacts/api-server/node_modules ./node_modules
EXPOSE 5000
CMD ["sh", "-c", "npx -y prisma@6.14.0 migrate deploy && node --enable-source-maps ./dist/index.mjs"]