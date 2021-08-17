[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-green.svg)](https://www.gnu.org/licenses/gpl-3.0)

Download the latest releases here
- [Windows](https://github.com/cpvalente/ontime/releases/download/v0.10-beta/ontime-win64.exe)

# Ontime
Ontime is an application for managing event rundowns and running stage timers.

It allows a center application to be able to distribute event information in the local network. This minimises needs for using Media Server outputs or expensive video distribution while allowing easy integration in workflows including OBS and d3.

![App Window](https://github.com/cpvalente/ontime/blob/master/01_app.png)

![Views](https://github.com/cpvalente/ontime/blob/master/02_screentypes.png)
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
- [x] OSC Control and Feedback
- [x] Roll mode: run independently from system clock

## Unopinionated
We are not interested in forcing workflows and have made ontime so it is flexible to whichever way you would like to work.


- [x] You do not need an order list to use the timer. Create an empty event and the OSC API works just the same
- [x] If you want just the info screens, no need to use the timer!
- [x] Dont have or care for a schedule?
  - [x] a single event with no data is enough to use the OSC API and get going
  - [x] use the order list to create a set of quick timers by setting the beggining and start times to 00:00 and 00:10 (**BAM**! 10 minute timer). You can quick recall this with OSC as always

## Roadmap
### For version 1
Almost reaching a feature set that we can call v1. Before that:
- [ ] Mac OS version
- [ ] Finish Documentation
### Continuing
- [ ] Linux version
- [ ] Headless version (run server only anywhere, configure from a browser locally)
- [ ] Companion integration
- [ ] Lower Third Manager
- [ ] Note only event
- [ ] URL Aliases (define configurable aliases to ease onsite setup)
- [ ] Logging view
- [ ] Reach Schedule: way to speedup timer to meet a deadline

# Help
Help is underway! ... and can be viewed [here](https://cpvalente.gitbook.io/ontime/)

# License
This project is licensed under the terms of the GNU GPL v3
