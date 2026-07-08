FROM node:24-bookworm AS base
WORKDIR /repo
RUN corepack enable
COPY . .

FROM base AS deps
ENV CI=true
RUN corepack enable && corepack pnpm install --frozen-lockfile

FROM deps AS build
WORKDIR /repo/artifacts/exam-platform
ENV NODE_ENV=production
ENV PORT=5000
ENV BASE_PATH=/
RUN corepack pnpm run build

FROM nginx:alpine AS runtime
COPY --from=build /repo/artifacts/exam-platform/dist /usr/share/nginx/html
COPY artifacts/exam-platform/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
