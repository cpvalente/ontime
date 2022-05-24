FROM node:14

WORKDIR /app/server

# Prepare UI
COPY /client/build ../client/build

# Prepare Backend
COPY /server/src ./

# Export default ports Main - OSC IN - OSC OUT
EXPOSE 4001 8888 9999
ENV NODE_ENV=production
ENV ONTIME_DATA=/server/db

CMD ["yarn", "start:headless"]

#docker build -t getontime/ontime .
#docker run -p 4001:4001 --mount type=bind,source="$(pwd)/local-data",target=/server/db getontime/ontime