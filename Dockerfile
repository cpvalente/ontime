FROM node:14-alpine

WORKDIR /app/server

# Prepare UI
COPY /client/build ../client/build

# Prepare Backend
COPY /server/src ./

# Export default ports Main - OSC IN - OSC OUT
EXPOSE 4001/tcp 8888/udp 9999/udp
ENV NODE_ENV=production
ENV ONTIME_DATA=/server/db

CMD ["yarn", "start:headless"]

# Build an run commandsN
# docker build -t getontime/ontime .
# docker run -p 4001:4001 -p 10.0.0.12:8888:8888/udp -p 127.0.0.1:9999:9999/udp --mount type=bind,source="$(pwd)/local-data",target=/server/db getontime/ontime
