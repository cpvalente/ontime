[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg)](https://www.gnu.org/licenses/gpl-3.0)
![GitHub Downloads (all assets, all releases)](https://img.shields.io/github/downloads/cpvalente/ontime/total)
![Docker Pulls](https://img.shields.io/docker/pulls/getontime/ontime)
![NPM Downloads](https://img.shields.io/npm/dy/%40getontime%2Fcli)
[![](https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86)](https://github.com/sponsors/cpvalente)
[![](https://img.shields.io/static/v1?label=Buy%20me%20a%20coffee&message=%E2%9D%A4&logo=buymeacoffee&color=%23fe8e86)](https://www.buymeacoffee.com/cpvalente)

## Download the latest release
<a href="https://www.buymeacoffee.com/cpvalente" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="32"></a>

- Download for <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-win64.exe">Windows</a>
- Download for <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-macOS-arm64.dmg">MacOS Arm</a>
- Download for <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-macOS-x64.dmg">MacOS Intel</a>
- Download AppImage for <a href="https://github.com/cpvalente/ontime/releases/latest/download/ontime-linux.AppImage">Linux</a>
- Get from <a href="https://hub.docker.com/r/getontime/ontime">Docker hub</a>

## Using Ontime?

Let us know!
Ontime improves from the collaboration with its users. We would like to understand how you use Ontime and appreciate your feedback.

We would also like to include a testimonials section in our ✨new website✨. It would be great to showcase the diversity of users running Ontime.

# Ontime

Ontime is a browser-based application that manages event rundowns, scheduling, and cueing.

With Ontime, you can plan, track your schedule, manage automation and cross-department show information all in one place.

Ontime is made by entertainment and broadcast engineers and used by

- Conference organisers
- Touring shows and receiving venues
- Broadcasters and streamers
- Theatres and opera houses
- Houses of worship

### For live environments

Ontime is designed for use in live environments. \
This guides the application into being flexible and efficiently integrating into different workflows.

### For teams

All information added in Ontime is shared with the production team and other software / hardware in your workflow. \
Ontime also improves team collaboration with dedicated views for cuesheets and operators, and for public and production
signage.

### Simple infrastructure

All the data is distributed over the network, making its distribution and infrastructure flexible and cheap. \
With the availability of the docker image, you can also leverage IT infrastructure to make Ontime available online for
your team and clients.

Ontime is made by video engineers and entertainment technicians.

![App Window](https://github.com/cpvalente/ontime/blob/master/.github/aux-images/editor.png)

![Views](https://github.com/cpvalente/ontime/blob/master/.github/aux-images/ontime-overview.webp)

[Read the docs to learn more](https://docs.getontime.no)

## Using Ontime

Ontime can be started by downloading the latest release for your platform. \
Alternatively you can also use the docker image, available at [Docker Hub](https://hub.docker.com/r/getontime/ontime)

Once installed and running, any device in the network has access to Ontime.

Ontime provides different screens which allow for different types of interactions with the data. These are called
views. \
Each view in Ontime focuses on empowering a specific role or achieving a particular task.

You can access the different views by reaching the ontime server, in your browser, at (_default port
4001_) `http://localhost:4001` or `http://192.168.1.3:4001`

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

- [x] Distribute data over network and render it in the browser
- [x] Collaborative
- [x] Extendable
- [x] Send messages to different screen types
- [x] Differentiate between backstage and public data
- [x] Workflow for managing delays
- [x] Rich protocol integrations for Control and Feedback
- [x] For servers: use docker to run Ontime in in a server, configure from a browser anywhere
- [x] Multi-platform (available on Windows, MacOS and Linux)
- [x] Companion integration [follow link](https://bitfocus.io/connections/getontime-ontime)

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

in Windows

`Microsoft Defender SmartScreen prevented an unrecognised app from starting. Running this app might put your PC at risk.`

or in Linux

`Could Not Display "ontime-linux.AppImage`

We currently only sign MacOS releases. \
Purchasing the certificates for both Mac and Windows would mean a recurrent expense which we are not able to cover.

You can circumvent this by allowing the execution of the app manually.

- In Windows: click `more` -> `Run Anyway`
- In Linux: right-click the AppImage file: `Properties` -> `Permissions` -> `Allow Executing File as a Program`

If you have tips on how to improve this or would like to sponsor the code signing,
please [open an issue](https://github.com/cpvalente/ontime/issues/new)

## Contributing

Looking to contribute? All types of help are appreciated, from coding to testing and feature specification.

If you are a developer and would like to contribute with code, please open an issue to discuss before opening a Pull Request.

Information about the project setup can be found in the [development documentation](./DEVELOPMENT.md)

## Links

See the [Ontime website](https://getontime.no) here and the link to the [documentation](https://docs.getontime.no)

## License

This project is licensed under the terms of the GNU GPL v3

## Sponsor

You can help the development of this project or say thank you with a one time donation. \
See [the terms of donations](https://github.com/cpvalente/ontime/blob/master/.github/FUNDING.md).

<p align="center">
<br>
<a href="https://www.buymeacoffee.com/cpvalente" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" width="200"></a>
</p>
