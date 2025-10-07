FROM node:22-alpine

# Set environment variables
# Environment Variable to signal that we are running production
ENV NODE_ENV=docker
# Ontime Data path
ENV ONTIME_DATA=/data/

RUN mkdir /app
WORKDIR /app/

# Prepare UI
COPY apps/client/build/ ./client/

# Prepare Backend
COPY apps/server/dist/ ./server/
COPY apps/server/src/external/ ./external/
COPY apps/server/src/user/ ./user/
COPY apps/server/src/html/ ./html/

# Export default ports
EXPOSE 4001/tcp 8888/udp 9999/udp

CMD ["node", "server/docker.cjs"]

# Build and run commands
# pnpm build:docker
# docker buildx build . -t getontime/ontime
# docker run -p 4001:4001 -p 8888:8888/udp -p 9999:9999/udp -v ./ontime-db:/data/ getontime/ontime
