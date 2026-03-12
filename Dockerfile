ARG NODE_VERSION=22.15.1

FROM node:${NODE_VERSION}-alpine AS builder

WORKDIR /app
RUN corepack enable

ENV ELECTRON_SKIP_BINARY_DOWNLOAD=1
ENV PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
ENV PUPPETEER_SKIP_DOWNLOAD=1

COPY . .

RUN pnpm install --frozen-lockfile || pnpm install
RUN pnpm build:docker

FROM node:${NODE_VERSION}-alpine

ENV PORT=4001
ENV HOST=0.0.0.0
ENV NODE_ENV=docker
ENV ONTIME_DATA=/data/

WORKDIR /app

COPY --from=builder /app/apps/client/build/ ./client/
COPY --from=builder /app/apps/server/dist/ ./server/
COPY --from=builder /app/apps/server/src/external/ ./external/
COPY --from=builder /app/apps/server/src/user/ ./user/
COPY --from=builder /app/apps/server/src/html/ ./html/

EXPOSE 4001/tcp 8888/udp 9999/udp

CMD ["node", "server/docker.cjs"]
