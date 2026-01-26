import { LogOrigin, OSCOutput, RuntimeStore } from 'ontime-types';

import { type OscPacketInput, toBuffer as oscPacketToBuffer } from 'osc-min';
import * as dgram from 'node:dgram';

import { logger } from '../../../classes/Logger.js';
import { parseTemplateNested, stringToOSCArgs } from '../automation.utils.js';

const udpClient = dgram.createSocket('udp4');

/**
 * Expose possibility to send a message using OSC protocol
 */
export function emitOSC(output: OSCOutput, store: RuntimeStore) {
  const message = preparePayload(output, store);
  emit(output.targetIP, output.targetPort, message);
}

/** Parses the state and prepares payload to be emitted */
function preparePayload(output: OSCOutput, store: RuntimeStore): OscPacketInput {
  // check for templates in the address
  const parsedAddress = parseTemplateNested(output.address, store);

  // check for templates in the arguments
  const parsedArguments = output.args ? parseTemplateNested(output.args, store) : undefined;
  // check we have the correct type
  const oscArguments = stringToOSCArgs(parsedArguments);
  return { address: parsedAddress, args: oscArguments };
}

/** Emits message over transport */
function emit(targetIP: string, targetPort: number, packet: OscPacketInput) {
  const buffer = oscPacketToBuffer(packet);
  udpClient.send(buffer, 0, buffer.byteLength, targetPort, targetIP, (error) => {
    if (error) {
      logger.warning(LogOrigin.Tx, `Failed sending OSC: ${error}`);
    }
  });
  return;
}
