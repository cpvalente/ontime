FROM node:14

WORKDIR /app

# Prepare UI
COPY /client/package.json ./
COPY /client/yarn.lock ./
## Install dependencies
RUN yarn --frozen-lockfile --prod
## Build
RUN yarn add react-scripts --latest -D
RUN yarn build

COPY . .

# Prepare Backend
COPY /server/src/package.json ./
COPY /server/src/yarn.lock ./
## Install dependencies
RUN yarn --frozen-lockfile --prod

COPY . .

# Export default ports Main - OSC IN - OSC OUT
# Would need to figure out how to expose dynamic stuff here
EXPOSE 4001 8888 9999
ENV NODE_ENV=production

CMD ["yarn", "start"]