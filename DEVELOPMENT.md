# GETTING STARTED

Ontime consists of 3 distinct parts
- __client__: A React app for Ontime's UI and web clients 
- __electron__: An electron app which facilitates the cross-platform distribution of Ontime
- __server__: A node application which handles the domains services and integrations

The steps below will assume you have locally installed the necessary dependencies. 
Other dependencies will be installed as part of the setup
- __node__ (>=16.16)
- __pnpm__ (>=7)
- __docker__ (only necessary to run and build docker images)

## LOCAL DEVELOPMENT

The electron app is only necessary to distribute an installable version of the app and is not required for local development.
Locally, we would need to run both the React client and the node.js server in development mode

From the project root, run the following commands
- __Install the project dependencies__ by running `pnpm i`
- __Run dev mode__ by running `turbo dev`

## CREATE AN INSTALLABLE FILE (Windows | MacOS | Linux)

Ontime uses Electron to distribute the application.
You can generate a distribution for your OS by running the following steps.

From the project root, run the following commands
- __Install the project dependencies__ by running `pnpm i`
- __Build the UI and server__ by running `turbo build`
- __Create the package__ by running `turbo dist-win`, `turbo dist-mac` or `turbo dist-linux`

The build distribution assets will be at `.apps/electron/dist`

## DOCKER

Ontime provides a docker-compose file to aid with building and running docker images.
While it should allow for a generic setup, it might need to be modified to fit your infrastructure.

From the project root, run the following commands
- __Install the project dependencies__ by running `pnpm i`
- __Build docker image from__ by running `docker build -t getontime/ontime`
- __Run docker image from compose__ by running `docker-compose up -d`

Other useful commands
- __List running processes__ by running `docker ps`
- __Kill running process__ by running `docker kill <process-id>`
