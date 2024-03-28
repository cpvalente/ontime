[![Ontime build v2](https://github.com/cpvalente/ontime/actions/workflows/build_v2.yml/badge.svg)](https://github.com/cpvalente/ontime/actions/workflows/build_v2.yml)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg)](https://www.gnu.org/licenses/gpl-3.0) 

## Download the latest releases here

<div style="display: flex; justify-content: space-around">
  <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-macOS-arm64.dmg"><img alt="Download MacOS" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/mac-download.png"/></a>
  <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-win64.exe"><img alt="Download Windows" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/win-download.png"/></a>
  <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-linux.AppImage"><img alt="Download Linux" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/linux-download.png"/></a>
  <a href="https://hub.docker.com/r/getontime/ontime"><img alt="Get from Dockerhub" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/dockerhub.png"/></a>
</div>

# Ontime

### For live environments
Ontime is designed for use in live environments. \ 
This guides the application into being flexible and efficiently integrating into different workflows. \

### For teams
All information added in Ontime is shared with the production team and other software / hardware in your workflow. \
Ontime also improves team collaboration with dedicated views for cuesheets and operators, and for public and production signage.

### Simple infrastructure
All the data is distributed over the network, making its distribution and infrastructure flexible and cheap. \
With the availability of the docker image, you can also leverage IT infrastructure to make Ontime available online for your team and clients.

Ontime is made by video engineers and entertainment technicians.

![App Window](https://github.com/cpvalente/ontime/blob/master/.github/aux-images/app.png)

![Views](https://github.com/cpvalente/ontime/blob/master/.github/aux-images/overview.png)

[Read the docs to learn more](https://docs.getontime.no)

## Using Ontime

Ontime can be started by downloading the latest release for your platform. \
Alternatively you can also use the docker image, available at [Docker Hub](https://hub.docker.com/r/getontime/ontime)

Once installed and running, Ontime starts a server in the local machine which maintains the entire application data.

Any device in the network has access to the data. 

You can access the different screens of the interface by reaching the ontime server at the _default port 4001_ eg: `localhost:4001`
or `192.168.1.3:4001`

```
For the presentation views
-------------------------------------------------------------
IP.ADDRESS:4001/timer      > Presenter / Stage timer view
IP.ADDRESS:4001/minimal    > Simple timer view
IP.ADDRESS:4001/clock      > Simple clock view
IP.ADDRESS:4001/sm         > Stage Manager / Backstage view
IP.ADDRESS:4001/public     > Public / Foyer view
IP.ADDRESS:4001/lower      > Lower Thirds
IP.ADDRESS:4001/studio     > Studio Clock
IP.ADDRESS:4001/countdown  > Countdown to anything
```

```
For management views
-------------------------------------------------------------
IP.ADDRESS:4001/editor    > the control interface, same as the app
IP.ADDRESS:4001/cuesheet  > realtime cuesheets for collaboration
IP.ADDRESS:4001/operator  > automated views for operators
```
```

More documentation is available [in our docs](https://docs.getontime.no)

## Feature List (in no specific order)

- [x] Distribute data over network and render it in the browser
- [x] Different screen types
- [x] Collaborative
- [x] [Make your own?](#make-your-own-viewer)
- [x] Send messages to different screen types
- [x] Differentiate between backstage and public data
- [x] Workflow for managing delays
- [x] Rich protocol integrations for Control and Feedback
  - OSC (Open Sound Control)
  - HTTP
  - WebSockets
- [x] [Headless run](#headless-run): run server in a separate machine, configure from a browser locally
- [x] Multi-platform (available on Windows, MacOS and Linux)
- [x] [Companion integration](https://bitfocus.io/connections/getontime-ontime)

## Roadmap

### Continued development

Several features are planned in the roadmap, and we continuously adjust this to match how users interact with the app.
<br />
Have an idea? Reach out via [email](mail@getontime.no)
or [open an issue](https://github.com/cpvalente/ontime/issues/new)

### Issues

We use Github's issue tracking for bug reporting and feature requests. <br />
Found a bug? [Open an issue](https://github.com/cpvalente/ontime/issues/new).

#### Unsigned App

When installing the app you would see warning screens from the Operating System like:

`Microsoft Defender SmartScreen prevented an unrecognised app from starting. Running this app might put your PC at risk.`

or

`Ontime can't be opened because it is from an unidentified developer`

or in Linux

`Could Not Display "ontime-linux.AppImage`

You can circumvent this by allowing the execution of the app manually.

- In Windows: click more and select "Run Anyway"
- in macOS: the solution in macOS is different across versions, please refer to the [apple documentation](https://support.apple.com/en-gb/guide/mac-help/mh40616/mac)
- In Linux: right-click the AppImage file -> Properties -> Permissions -> select Allow Executing
  File as a Program

Long story short: Ontime app is unsigned. </br>Purchasing the certificates for both Mac and Windows
would mean a recurrent expense and is not a priority. This is unlikely to change in future. If you
have tips on how to improve this or would like to sponsor the code signing,
please [open an issue](https://github.com/cpvalente/ontime/issues/new)

#### Safari

There are known issues with Safari versions lower than 13:

- Spacing and text styles might have small inconsistencies
- Table view does not work

There is no plan for any further work on this.

# Contributing

Looking to contribute? All types of help are appreciated, from coding to testing and feature specification.
<br /><br />
If you are a developer and would like to contribute with some code, please open an issue to discuss before opening a
Pull Request.
<br />
Information about the project setup can be found in the [development documentation](./DEVELOPMENT.md)

# Help

Help is underway! ... and can be found [here](https://docs.getontime.no)

# License

This project is licensed under the terms of the GNU GPL v3
