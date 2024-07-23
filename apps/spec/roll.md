# ROLL Mode

Roll mode is intended to be a fully automatic playback that takes precedence over event end actions.
It can be user either on its own, or as in conjunction with manual playback to allow for automated rundown sections.

## Overview
- As long as there are non-skipped events in the rundown, we will always accept roll mode
- If there are no events in the current time frame, we load the next event and count-down to its start
- Roll will always load the first matching event in the current time, this could cause issues if there are multiple days planned or if the rundown is not in order.
- If we go from manual playback, to Roll mode, the playback should continue as is. Roll mode will automate loading the next event when the current is finished

## Implementation details

### starting to roll
> RuntimeService.roll(rundown: OntimeRundown)

When calling the roll function, we try and find events to load. There should always be an event as long as the rundown is not empty.

#### Taking over playback
If we are currently in "Play" mode and an event is playing, roll simply takes over playback. No other data changes are made

#### Starting an event
If there is nothing playing and roll finds an element that in the current time frame playing, it will start the event

#### Waiting to start
If we do not find an event that should be playing now, but find an event for the future, we load the next event, set roll mode and wait

### tick update 
> RuntimeState.onUpdate()

Updating in roll mode attempts to have the least amount of custom logic in relation to normal updates. The only difference in behaviour is the automation of loading the next event when the current one is finished.

#### normal update
On the update of timers, there is no logic specific to Roll mode, all side effects (ie: integrations) should have the same behaviour as Play mode

#### waiting to start
If we are currently waiting to start, we just need to update the `secondaryTimer`.
If waiting to start is finished, we load the next event and start it

#### an event is finished
If an event is finished, we check if the next event is ready to start, this is similarly as if we had a conditional `load-next` `play-next` automation
If there is a gap between the events, we add `secondaryTimer` to match and wait for the next event to start
Finish time should account for `timer.addedTime`
Finish actions are ignored in roll mode

#### time has skipped
If we find that the new time update has slid in comparison to the old update (either too long, or time went backwards), we re-calculate

### Finding an event 
> loadRoll(timedEvents: OntimeEvent[], timeNow: number)
This is a helper function which iterates trough a rundown to find the first matching element in the current time. As a trade-off, the wrong event will be loaded if the rundown is not in order.

It is important to note that all times in the rundown are in milliseconds from midnight. In the case of multiple days being scheduled, Roll will return the first match.

### Assumptions
The function receives a pre-filtered list of `TimedEvents`. This is to avoid issues with inconsistent index references. 
- `TimedEvents` cannot be an empty array
- `TimedEvents` is assumed to be in order

### Specification
- we should always receive an `eventNow` or `eventNext`
- if the current clock is past the last event end, we roll for the events tomorrow
- if the current clock is before the first event, we do not load next day events, even if there is a match, we always start on first day
