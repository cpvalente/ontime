import { LogOrigin, OSCOutput } from 'ontime-types';

import { Client, Message } from 'node-osc';

import { logger } from '../../../classes/Logger.js';
import { type RuntimeState } from '../../../stores/runtimeState.js';
import { parseTemplateNested, stringToOSCArgs } from '../automation.utils.js';

/**
 * Expose possibility to send a message using OSC protocol
 */
export function emitOSC(output: OSCOutput, state: RuntimeState) {
  const message = preparePayload(output, state);
  emit(output.targetIP, output.targetPort, message);
}

/** Parses the state and prepares payload to be emitted */
function preparePayload(output: OSCOutput, state: RuntimeState): Message {
  // check for templates in the address
  const parsedAddress = parseTemplateNested(output.address, state);
  const message = new Message(parsedAddress);

  // check for templates in the arguments
  const parsedArguments = output.args ? parseTemplateNested(output.args, state) : undefined;
  // check we have the correct type
  message.append(stringToOSCArgs(parsedArguments));
  return message;
}

/** Emits message over transport */
function emit(targetIP: string, targetPort: number, message: Message) {
  logger.info(LogOrigin.Rx, `Sending OSC: ${targetIP}:${targetPort}`);

  const oscClient = new Client(targetIP, targetPort);
  oscClient.send(message, () => {
    oscClient.close();
  });
  return;
}
