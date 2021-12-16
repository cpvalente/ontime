[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg)](https://www.gnu.org/licenses/gpl-3.0) [![Documentation in Gitbook](https://badges.aleen42.com/src/gitbook_2.svg)](https://cpvalente.gitbook.io/ontime/)


Download the latest releases here
- [Windows](https://gitreleases.dev/gh/cpvalente/ontime/latest/ontime-win64.exe)

# Ontime
Ontime is an application for managing event rundowns and running stage timers.

It allows a center application to be able to distribute event information in the local network. This minimises needs for using Media Server outputs or expensive video distribution while allowing easy integration in workflows including OBS and d3.

![App Window](https://github.com/cpvalente/ontime/blob/master/.github/01_app.png)

![Views](https://github.com/cpvalente/ontime/blob/master/.github/02_screentypes.png)

## Using Ontime
Once installed and running, ontime starts a background server that is the heart of all processes.
The app, is used to add / edit your running order in the event list, and running the timers using the Playback Control function.

From here, any device in the same network with a browser is able to render the views as described. This is done by reaching the ontime server at the _default port 4001_ eg: `localhost:4001` or `192.168.1.3:4001`
You can then use the ontime logo in the top right corner to select the desired view (event in the lower thirds view, where it is hidden).

In case of unattended machines or automations, it is possible to use different URL to recall individual views

```
IP.ADDRESS:4001           > Web server default to presenter timer view
IP.ADDRESS:4001/preseter  > Presenter / Stage timer view
IP.ADDRESS:4001/sm        > Stage Manager / Backstage view
IP.ADDRESS:4001/public    > Public / Foyer view
IP.ADDRESS:4001/pip       > Picture in Picture view
IP.ADDRESS:4001/lower     > Lower Thirds
IP.ADDRESS:4001/studio    > Studio Clock
```

More documentation available [here](https://cpvalente.gitbook.io/ontime/)
## Feature List (in no specific order)
- [x] Distribute Data over network and render in the browser
- [x] Different screen types
  - Stage Timer
  - Backstage Info
  - Public Info
  - Picture in Picture
- [x] Configurable realtime Lower Thirds
- [x] Send live messages to different screen types
- [x] Ability to differentiate between backstage and public data
- [x] Manage delays workflow
- [x] Open Sound Control (OSC) Control and Feedback
- [x] Roll mode: run independently using the system clock
- [x] Import event list from Excel

## Unopinionated
We are not interested in forcing workflows and have made ontime, so it is flexible to whichever way you would like to work.


- [x] You do not need an order list to use the timer. Create an empty event and the OSC API works just the same
- [x] If you want just the info screens, no need to use the timer!
- [x] Don't have or care for a schedule?
  - [x] a single event with no data is enough to use the OSC API and get going
  - [x] use the order list to create a set of quick timers by setting the beginning and start times to 00:00 and 00:10 (**BAM**! 10 minute timer). You can quickly recall this with OSC as always

## Integrations and Workflow
The app is being currently developed to a wide user base, from broadcast to entertainment and conference halls.

Taking advantage of the integrations in Ontime, we currently use Ontime with: 
- `disguise`: trigger ontime from d3's timeline using the **OSC API**, **render views** using d3's webmodule
- `OBS`: **render views** using the Browser Module
- `QLab`: trigger ontime using **OSC API**
- `Companion`: trigger ontime and manipulate timer using **OSC API**


## Roadmap
### Continued development
There are several features planned in the roadmap. 
These will be implemented in a development friendly order unless there is user demand to bump any of them.
- [ ] Linux version
- [ ] Headless version (run server only anywhere, configure from a browser locally)
- [ ] Companion module
- [ ] Lower Third Manager
- [ ] Note only event
- [ ] URL Aliases (define configurable aliases to ease onsite setup)
- [ ] Logging view
- [ ] Reach Schedule: way to speedup timer to meet a deadline
- [ ] vMix integration

### For version 1
Almost reaching a feature set that we can call v1. Before that:
- [ ] Mac OS version

### Issues
The app is still in pre-release and there are a few issues, mainly concerning style.
This will be receiving attention as we near v1 release

#### Style
- [ ] App needs improvement on handling zoomed interfaces: Please ensure that windows settings have no display zoom (it is 125% by default)
- [ ] Very long titles might cause interface to shift

# Help
Help is underway! ... and can be viewed [here](https://cpvalente.gitbook.io/ontime/)

# License
This project is licensed under the terms of the GNU GPL v3
