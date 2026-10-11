import * as dgram from 'node:dgram';

import { OSCOutput, RuntimeStore } from 'ontime-types';
import { type OscPacketInput, toBuffer as oscPacketToBuffer } from 'osc-min';
import { DeepReadonly } from 'ts-essentials';

import { isOntimeCloud } from '../../../setup/environment.js';
import { parseTemplateNested, stringToOSCArgs } from '../automation.utils.js';
import { reportSendFailure, reportSendSuccess } from './sendFailures.js';

/** cloud instances are reached over HTTP only, OSC output is always disabled there */
const isOscOutputEnabled = !isOntimeCloud;
const udpClient = isOscOutputEnabled ? dgram.createSocket('udp4') : null;

/**
 * Expose possibility to send a message using OSC protocol
 */
export function emitOSC(output: OSCOutput, store: DeepReadonly<RuntimeStore>) {
  // a disabled dispatcher drops the message, as automations do when turned off
  if (!udpClient) {
    return;
  }
  const message = preparePayload(output, store);
  const targetIP = parseTemplateNested(output.targetIP, store);
  emit(udpClient, targetIP, output.targetPort, message);
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
function emit(socket: dgram.Socket, targetIP: string, targetPort: number, packet: OscPacketInput) {
  const buffer = oscPacketToBuffer(packet);
  const target = `${targetIP}:${targetPort}`;
  socket.send(buffer, 0, buffer.byteLength, targetPort, targetIP, (error) => {
    if (error) {
      reportSendFailure(target, `Failed sending OSC to ${target}: ${error}`);
    } else {
      reportSendSuccess(target);
    }
  });
  return;
}
