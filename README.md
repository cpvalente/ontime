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

Ontime is an application for creating and managing event running order and timers.

The user inputs a list of events along with scheduling and event information.
This will then populate a series of screens which are available to be rendered by any device in the Network.

This makes for a simple and cheap way to distribute over a venue using a network infrastructure instead of video outputs.

![App Window](https://github.com/cpvalente/ontime/blob/master/.github/aux-images/app.png)

![Views](https://github.com/cpvalente/ontime/blob/master/.github/aux-images/overview.png)

[Read the docs to learn more](https://docs.getontime.no)

## Using Ontime

Once installed and running, Ontime starts a background server that is the heart of all processes.
From the app, you can add / edit your running order and control the timer playback.

Any device with a browser in the same network can choose one of the supported views to render the available data.
This is done by reaching the ontime server at the _default port 4001_ eg: `localhost:4001`
or `192.168.1.3:4001`
<br />
You can then use the menu in the top left corner to select the desired view.
The menu will be initially hidden until there is mouse interaction.

In the case of unattended machines or automation, it is possible to use different URL to recall
individual views and extend view settings using the URL presets feature

```
For the presentation views
-------------------------------------------------------------
IP.ADDRESS:4001            > Web server default to presenter timer view
IP.ADDRESS:4001/timer      > Presenter / Stage timer view
IP.ADDRESS:4001/minimal    > Simple timer view
IP.ADDRESS:4001/clock      > Simple clock view
IP.ADDRESS:4001/sm         > Stage Manager / Backstage view
IP.ADDRESS:4001/public     > Public / Foyer view
IP.ADDRESS:4001/lower      > Lower Thirds
IP.ADDRESS:4001/studio     > Studio Clock
```

```
For management views
-------------------------------------------------------------
IP.ADDRESS:4001/editor    > the control interface, same as the app
IP.ADDRESS:4001/cuesheet  > realtime cuesheets for collaboration
```

More documentation is available [in our docs](https://docs.getontime.no)

## Feature List (in no specific order)

- [x] Distribute data over network and render it in the browser
- [x] Different screen types
  - Stage Timer
  - Minimal Timer
  - Clock
  - Backstage Info
  - Public Info
  - Studio Clock
  - Countdown
  - [Make your own?](#make-your-own-viewer)
- [x] Configurable Lower Thirds
- [x] Collaborative editing with the cuesheet view
- [x] Send live messages to different screen types
- [x] Differentiate between backstage and public data
- [x] Workflow for managing delays
- [x] Rich protocol integrations for Control and Feedback
  - OSC (Open Sound Control)
  - HTTP
  - WebSockets
- [x] Roll mode: run standalone using the system clock
- [x] [Headless run](#headless-run): run server in a separate machine, configure from a browser locally
- [x] [Countdown to anything!](https://docs.getontime.no/features/count-to-anything/): have
      a countdown to any scheduled event
- [x] Multi-platform (available on Windows, MacOS and Linux)
- [x] [Companion integration](https://bitfocus.io/connections/getontime-ontime)

## Unopinionated

We want Ontime to be unique by targeting freelancers instead of roles.

We believe most freelancers work in different fields and we want to give you a tool that you can leverage across your
many environments and workflows.

We are not interested in forcing workflows and have made Ontime so, it is flexible to whichever way you would like to
work.

## Rich APIs for workflow integrations

The app is currently being developed for a broad user base, from broadcast to entertainment and
conference halls.

Taking advantage of the integrations, we currently use Ontime with:

- `disguise`: trigger Ontime from d3's timeline using the **OSC API**, and **render views** using d3's
  webmodule
- `OBS`: **render views** using the Browser Module
- `QLab`: trigger Ontime using **OSC API**
- `Companion`: Ontime has a **companion module**. Issue report and feature requests should be done
  in the [repository getontime/ontime](https://github.com/bitfocus/companion-module-getontime-ontime)

### Make your own viewer

Ontime broadcasts its data over WebSockets. This allows you to consume its data outside the application.

Writing a new view for the browser can be done with basic knowledge of HTML + CSS + Javascript (or any other language
that can run in the browser).
<br />
We have prepared a few resources to help here:
- Shipped with Ontime there is a small clock to get you started, it is available at `http://localhost:4001/external/demo` and the [code can be found here](https://github.com/cpvalente/ontime/tree/master/apps/server/src/external/demo)
- See [this repository](https://github.com/cpvalente/ontime-viewer-template-v2) with a template on
how to get you started
- See information about the [Websocket API](https://docs.getontime.no/api/osc-and-ws/)
<br />
More information [in the docs](https://docs.getontime.no/features/custom-views/)


### Headless run️

You can self-host and run Ontime in a docker image.

The docker image along with documentation is [available Docker Hub at getontime/ontime](https://hub.docker.com/r/getontime/ontime)

If you want to run this image in a Raspberry Pi, please see [the docs](https://docs.getontime.no/additional-notes/use-with-rpi/)

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
