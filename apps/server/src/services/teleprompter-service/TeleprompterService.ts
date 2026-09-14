import type { TeleprompterCommand, TeleprompterControlState } from 'ontime-types';

type ClientId = string;
type DeliverCommand = (target: ClientId, commandId: string, command: TeleprompterCommand) => void;

/**
 * Ephemeral state for connected teleprompter views. The view reports observed
 * transport state; this service never attempts to own document geometry or
 * replay a relative nudge after a reconnect.
 */
export class TeleprompterService {
  private readonly states = new Map<ClientId, TeleprompterControlState>();
  private readonly commandReceipts = new Map<ClientId, Map<string, string>>();

  register(clientId: ClientId) {
    this.commandReceipts.set(clientId, new Map());
  }

  remove(clientId: ClientId) {
    this.states.delete(clientId);
    this.commandReceipts.delete(clientId);
  }

  report(clientId: ClientId, state: TeleprompterControlState) {
    this.states.set(clientId, state);
  }

  getState(clientId: ClientId) {
    return this.states.get(clientId);
  }

  deliver(clientId: ClientId, commandId: string, command: TeleprompterCommand, deliver: DeliverCommand) {
    const receipts = this.commandReceipts.get(clientId);
    if (!receipts) throw new Error(`Client "${clientId}" not found`);

    const serialized = JSON.stringify(command);
    const previous = receipts.get(commandId);
    if (previous === serialized) return;
    if (previous !== undefined)
      throw new Error(`Teleprompter command id "${commandId}" was reused with different data`);

    deliver(clientId, commandId, command);
    receipts.set(commandId, serialized);
    if (receipts.size > 100) receipts.delete(receipts.keys().next().value as string);
  }
}

export const teleprompterService = new TeleprompterService();
