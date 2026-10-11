import * as dgram from 'node:dgram';

import { OSCOutput, RuntimeStore } from 'ontime-types';
import { type OscPacketInput, toBuffer as oscPacketToBuffer } from 'osc-min';
import { DeepReadonly } from 'ts-essentials';

import { parseTemplateNested, stringToOSCArgs } from '../automation.utils.js';
import { reportSendFailure, reportSendSuccess } from './sendFailures.js';

const udpClient = dgram.createSocket('udp4');

/**
 * Expose possibility to send a message using OSC protocol
 */
export function emitOSC(output: OSCOutput, store: DeepReadonly<RuntimeStore>) {
  const message = preparePayload(output, store);
  const targetIP = parseTemplateNested(output.targetIP, store);
  emit(targetIP, output.targetPort, message);
}

/** Parses the state and prepares payload to be emitted */
function preparePayload(output: OSCOutput, store: DeepReadonly<RuntimeStore>): OscPacketInput {
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
  const target = `${targetIP}:${targetPort}`;
  udpClient.send(buffer, 0, buffer.byteLength, targetPort, targetIP, (error) => {
    if (error) {
      reportSendFailure(target, `Failed sending OSC to ${target}: ${error}`);
    } else {
      reportSendSuccess(target);
    }
  });
  return;
}
