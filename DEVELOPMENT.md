# GETTING STARTED

Ontime consists of 3 distinct parts

- **client**: A React app for Ontime's UI and web clients
- **electron**: An electron app which facilitates the cross-platform distribution of Ontime
- **server**: A node application which handles the domains services and integrations

The steps below will assume you have locally installed the necessary dependencies.
Other dependencies will be installed as part of the setup

- **node** (~22)
- **pnpm** (~10)
- **docker** (only necessary to run and build docker images)

## LOCAL DEVELOPMENT

The electron app is only necessary to distribute an installable version of the app and is not required for local
development.
Locally, we would need to run both the React client and the node.js server in development mode

From the project root, run the following commands

- **Install the project dependencies** by running `pnpm i`
- **Create a local build** by running `pnpm build`, this will populate local dependencies
- **Run dev mode** by running `pnpm dev` or `pnpm dev:electron` to get the electron window

### Debugging backend

The previous command will start the development servers for both the client, server and electron applications.
Typically in dev mode we prefer to start these in separate terminals to help with error tracking and debugging.

We do that by creating two terminals an running

- **Run the React UI** by running `pnpm dev --filter=ontime-ui`
- **Run the nodejs server** by running `pnpm dev --filter=ontime-server`

- If you need to set breakpoints and inspect the code execution, enable Node.js inspect mode by running `pnpm dev:inspect --filter=ontime-server`.

## TESTING

Generally we have 2 types of tests.

- Unit tests for functions that contain business logic
- End-to-end tests for core features

### Unit tests

Unit tests are contained in mostly all the apps and packages (client, server and utils)

You can run unit tests by running `pnpm test:pipeline` from the project root.
This will run all tests and close test runner.

Alternatively you can navigate to an app or project and run `pnpm test` to run those tests in watch mode

### E2E tests

E2E tests are in a separate package. On running, [playwright](https://playwright.dev/) will spin up an instance of the
webserver to test against
These tests also run against a separate version of the DB (test-db)

Before running the E2E, you should first build the project with `pnpm build:local`.

You can run playwright tests from project root with `pnpm e2e`

When writing tests, it can be handy to run playwright in interactive mode with `pnpm e2e:i`. You would need to manually
start the webserver with `pnpm dev:server`

Some other useful commands

- `pnpm e2e:ui` open playwright UI
- `pnpm e2e --headed` run tests with a visible browser window

## CREATE AN INSTALLABLE FILE (Windows | MacOS | Linux)

Ontime uses Electron to distribute the application.
You can generate a distribution for your OS by running the following steps.

From the project root, run the following commands

- **Install the project dependencies** by running `pnpm i`
- **Build the UI and server** by running `pnpm build`
- **Create the package** by running `pnpm dist-win`, `pnpm dist-mac` or `pnpm dist-linux`

The build distribution assets will be at `.apps/electron/dist`

## DOCKER

Ontime provides a docker-compose file to aid with building and running docker images.
While it should allow for a generic setup, it might need to be modified to fit your infrastructure.

From the project root, run the following commands

- **Build docker image from** by running `docker build -t getontime/ontime .`
- **Run docker image from compose** by running `docker-compose up -d`

Other useful commands

- **List running processes** by running `docker ps`
- **Kill running process** by running `docker kill <process-id>`

## FORMATTING AND LINTING

Ontime uses [oxfmt](https://oxc.rs/docs/guide/usage/formatter.html) for formatting and [oxlint](https://oxc.rs/docs/guide/usage/linter.html) for linting. Look for an [oxc extension](https://oxc.rs/docs/guide/usage/linter/editors) for your editor of choice.

- **Run formatter** by running `pnpm format`
- **Run linter** by running `pnpm lint`

## CONTRIBUTION GUIDELINES

If you want to propose changes to the codebase, please reach out before opening a Pull Request.

For new PRs, please follow the following checklist:

- [ ] You have updated and ran unit locally and they are passing. Unit tests are generally created for all utility functions and business logic
- [ ] You have ran code formatting and linting in all your changes
- [ ] The branch is clean and the commits are meaningfully separated and contain descriptive messages
- [ ] The PR body contains description and motivation for the changes

After this checklist is complete, you can request a review from one of the maintainers to get feedback and approval on the changes. \
We will review as soon as possible
