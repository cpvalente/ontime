FROM node:16-alpine

# Set environment variables
# Environment Variable to signal that we are running production
ENV NODE_ENV=production
# Ontime Data path
ENV ONTIME_DATA=./db/

WORKDIR /Resources/extraResources/

# Prepare UI
COPY /apps/client/build ./client/

# Prepare Backend
COPY /apps/server/dist/ ./server/
COPY /demo-db/ ./preloaded-db/
COPY /apps/server/src/external/ ./external/

# Export default ports
# Ontime Interface
EXPOSE 4001/tcp 
# OSC In
EXPOSE 8888/udp
# OSC Out
EXPOSE 9999/udp

VOLUME ./external/
VOLUME ./db/

CMD ["node", "server/docker.cjs"]

# Build and run commands
# !!! Note that this command needs pre-build versions of the UI and server apps
# docker build -t getontime/ontime .
# docker run -p 4001:4001 -p 10.0.0.12:8888:8888/udp --mount type=bind,source="$(pwd)/ontime-db",target=/server/preloaded-db getontime/ontime
