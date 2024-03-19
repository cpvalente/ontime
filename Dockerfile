FROM node:18.18-alpine

# Set environment variables
# Environment Variable to signal that we are running production
ENV NODE_ENV=docker
# Ontime Data path
ENV ONTIME_DATA=/external/

WORKDIR /app/

# Prepare UI
COPY /apps/client/build ./client/

# Prepare Backend
COPY /apps/server/dist/ ./server/
COPY /demo-db/ ./preloaded-db/
COPY /apps/server/src/external/ ./external/

# Export default ports
EXPOSE 4001/tcp 8888/udp 9999/udp

CMD ["node", "server/docker.cjs"]

# Build and run commands
# !!! Note that this command needs pre-build versions of the UI and server apps
# docker buildx build . -t getontime/ontime
# docker run -p 4001:4001 -p 8888:8888/udp -p 9999:9999/udp -v ./ontime-db:/external/db/ -v ./ontime-styles:/external/styles/ getontime/ontime
