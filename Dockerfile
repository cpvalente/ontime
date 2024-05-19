FROM node:18.18-alpine as builder
ENV NODE_ENV=docker
ENV ONTIME_DATA=/external/
WORKDIR /app/
RUN wget -qO- https://get.pnpm.io/install.sh | ENV="$HOME/.shrc" SHELL="$(which sh)" sh -
COPY . /app/
RUN PNPM_HOME="/root/.local/share/pnpm" PATH="${PATH}:/root/.local/share/pnpm" pnpm i
run PNPM_HOME="/root/.local/share/pnpm" PATH="${PATH}:/root/.local/share/pnpm" pnpm run build:localdocker

FROM node:18.18-alpine

# Set environment variables
# Environment Variable to signal that we are running production
ENV NODE_ENV=docker
# Ontime Data path
ENV ONTIME_DATA=/external/

WORKDIR /app/

# Prepare UI
COPY --from=builder /app/apps/client/build ./client/

# Prepare Backend
COPY --from=builder /app/apps/server/dist/ ./server/
COPY ./demo-db/ ./preloaded-db/
COPY --from=builder /app/apps/server/src/external/ ./external/

# Export default ports
EXPOSE 4001/tcp 8888/udp 9999/udp

CMD ["node", "server/docker.cjs"]

# Build and run commands
# !!! Note that this command needs pre-build versions of the UI and server apps
# docker buildx build . -t getontime/ontime
# docker run -p 4001:4001 -p 8888:8888/udp -p 9999:9999/udp -v ./ontime-db:/external/db/ -v ./ontime-styles:/external/styles/ getontime/ontime
