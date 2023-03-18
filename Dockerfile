FROM node:16-alpine

WORKDIR /Resources/extraResources/

# Prepare UI
COPY /apps/client/build ./client/

# Prepare Backend
COPY /apps/server/dist/ ./server/
COPY /apps/server/preloaded-db ./preloaded-db/

# Export default ports Main - OSC IN
EXPOSE 4001/tcp 8888/udp
ENV NODE_ENV=production
ENV ONTIME_DATA=/server/

CMD ["node", "server/docker.cjs"]

# Build and run commands
# !!! Note that this command needs pre-build versions of the UI and server apps
# docker build -t getontime/ontime .
# docker run -p 4001:4001 -p 10.0.0.12:8888:8888/udp --mount type=bind,source="$(pwd)/ontime-db",target=/server/preloaded-db getontime/ontime
