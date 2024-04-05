[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg)](https://www.gnu.org/licenses/gpl-3.0) 
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/cpvalente/ontime/total)
![Docker Pulls](https://img.shields.io/docker/pulls/getontime/ontime)
[![](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/cpvalente)
[![](https://img.shields.io/static/v1?label=Buy%20me%20a%20coffee&message=%E2%9D%A4&logo=buymeacoffee&color=%23fe8e86)](https://www.buymeacoffee.com/cpvalente)


## Download the latest releases here

<div style="display: flex; justify-content: space-around">
  <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-macOS-arm64.dmg"><img alt="Download MacOS" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/mac-download.png"/></a>
  <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-win64.exe"><img alt="Download Windows" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/win-download.png"/></a>
  <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-linux.AppImage"><img alt="Download Linux" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/linux-download.png"/></a>
  <a href="https://hub.docker.com/r/getontime/ontime"><img alt="Get from Dockerhub" src="https://github.com/cpvalente/ontime/blob/master/.github/aux-images/dockerhub.png"/></a>
</div>

<br />

<a href="https://www.buymeacoffee.com/cpvalente" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="32"></a>

# Ontime

Ontime is an application for creating and managing event rundowns and timers.

### For live environments
Ontime is designed for use in live environments. \
This guides the application into being flexible and efficiently integrating into different workflows.

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

Once installed and running, any device in the network has access to Ontime.

Ontime provides different screens which allow for different types of interactions with the data. These are called views. \
Each view in Ontime focuses on empowering a specific role or achieving a particular task. 

You can access the different views by reaching the ontime server, in your browser, at (_default port 4001_) `http://localhost:4001` or `http://192.168.1.3:4001`

```
For the backstage views
-------------------------------------------------------------
IP.ADDRESS:4001/timer      > Presenter / Stage timer view
IP.ADDRESS:4001/minimal    > Simple timer view
IP.ADDRESS:4001/clock      > Simple clock view
IP.ADDRESS:4001/backstage  > Stage Manager / Backstage view
IP.ADDRESS:4001/countdown  > Countdown to anything
IP.ADDRESS:4001/studio     > Studio Clock
```

```
For the public views
-------------------------------------------------------------
IP.ADDRESS:4001/public     > Public / Foyer view
IP.ADDRESS:4001/lower      > Lower Thirds
```

```
For production views
-------------------------------------------------------------
IP.ADDRESS:4001/editor    > the control interface, same as the app
IP.ADDRESS:4001/cuesheet  > realtime cuesheets for collaboration
IP.ADDRESS:4001/operator  > automated views for operators
```

More documentation is available [in our docs](https://docs.getontime.no)

## Main features

* [x] Distribute data over network and render it in the browser 
* [x] Collaborative 
* [x] Extendable
* [x] Send messages to different screen types
* [x] Differentiate between backstage and public data
* [x] Workflow for managing delays
* [x] Rich protocol integrations for Control and Feedback
* [x] For servers: use docker to run Ontime in in a server, configure from a browser anywhere
* [x] Multi-platform (available on Windows, MacOS and Linux)
* [x] Companion integration [follow link](https://bitfocus.io/connections/getontime-ontime)

## Roadmap

### Continued development

Ontime is under active development. We continue adding and tweaking features in collaboration with users.

Have an idea? Reach out via [email](mail@getontime.no)
or [open an issue](https://github.com/cpvalente/ontime/issues/new)

### Issues

We use Github's issue tracking for bug reporting and feature requests. \
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

Long story short: Ontime app is unsigned. \
Purchasing the certificates for both Mac and Windows would mean a recurrent expense and is not a priority. \
This is unlikely to change in future. \
If you have tips on how to improve this or would like to sponsor the code signing, please [open an issue](https://github.com/cpvalente/ontime/issues/new)

#### Safari

There are known issues with Safari versions lower than 13:

- Spacing and text styles might have small inconsistencies
- Table view does not work

There is no plan for any further work on this.

## Contributing

Looking to contribute? All types of help are appreciated, from coding to testing and feature specification.

If you are a developer and would like to contribute with some code, please open an issue to discuss before opening a
Pull Request.

Information about the project setup can be found in the [development documentation](./DEVELOPMENT.md)

## Help

Help is underway! ... and can be found [here](https://docs.getontime.no)

## License

This project is licensed under the terms of the GNU GPL v3

## SPONSOR

You can help the development of this project or say thank you with a one time donation. \
See [the terms of donations](https://github.com/cpvalente/ontime/blob/master/.github/FUNDING.md).

<p align="center">
<br>
<a href="https://www.buymeacoffee.com/cpvalente" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="200"></a>
</p>
