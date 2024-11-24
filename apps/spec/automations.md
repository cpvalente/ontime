# Automations

The automation feature's purpose is to integrate ontime into users' workflows.
Ontime has a large amount of production information, which users need considerable effort to maintain. We want to allow tools so that:

- allow distribution of Ontime's and other production data
- allow surfacing Ontime events
- allow synchronizing with other tools

## Previous

Previous iterations imposed limitations on the number of integrations and target devices to evaluate performance concerns.

The feature was not as used as we had hoped, and users often escalated the integration to tools like Companion.
I believe this to be in part from a lack of clarity on the feature and the limitations imposed

- Lack of explicit filtering logic made the process hard to reason
- Users met limitations on target devices earlier than expected. We would want users to meet these limitations only when the project grew over a size where a show controller would be needed
- Building the template strings was complex and poorly documented

## Overview

- The user should be able to create as many automations as they want
- Automations are triggered by lifecycle events
- Each automation should go through a user-defined filtering process
- Each automation should be able to target multiple devices and multiple protocols
- We leverage HTTP / OSC as the main protocols ~~and add support for triggering Companion button presses~~
- To allow easier debugging and "learn" workflows, users should be able to test a message before saving the automation
- We should have inline documentation for the template strings

> ⚠️ **Companion module** \
> We have opted for removing the requirement for companion module integration. \
> We did not see as much friction that could be solved with a custom integration as initially thought. Triggering a button press in companion is done trivially over either OSC or HTTP and companion users are familiar with the process.

## Implementation details

- To simplify the usage of template strings, we will generate a list of template strings at runtime from the user project file
- To allow easier implementation and extensions, we want to keep the automations separate from triggers

```ts
type Automation = {
  id: AutomationId;
  name: string;
  filter: Filter[];
  output: Output[];
};

type Trigger = {
  id: string;
  event: TimerLifecycle;
  automations: AutomationId[];
};
```

### Extension

- Users have expressed a desire to have automation triggered by the lifecycle of a specific event. By keeping the trigger separate from the automation, we will allow this to be implemented in the future.
