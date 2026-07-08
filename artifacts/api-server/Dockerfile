FROM node:24-slim AS base
WORKDIR /repo
RUN corepack enable
COPY . .

FROM base AS deps
RUN corepack enable && corepack pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /repo/artifacts/api-server
RUN corepack pnpm run build

FROM node:24-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# Install C, C++, Python, and Java compilers/runtimes
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    python3 \
    default-jdk \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /repo/artifacts/api-server/dist ./dist
COPY --from=build /repo/artifacts/api-server/package.json ./package.json
COPY --from=build /repo/node_modules ./node_modules
EXPOSE 5000
CMD ["node", "--enable-source-maps", "./dist/index.mjs"]