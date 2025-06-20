import { MessageState } from 'ontime-types';
import { DeepPartial } from 'ts-essentials';

export type LegacyMessageState = DeepPartial<{
  timer: {
    text: string;
    visible: boolean;
    blink: boolean;
    blackout: boolean;
  };
  external: {
    text: string;
    visible: boolean;
  };
}>;

function isLegacyMessageState(value: object): value is LegacyMessageState {
  // @ts-expect-error -- good enough here
  return value?.external?.text !== undefined || value?.external?.visible !== undefined;
}

/**
 * This function is used to maintain support for legacy data in the /message endpoint
 * The previous message endpoint expected a patch of the message state
 * @example {
 *  timer: { blink: boolean, blackout: boolean, text: string, visible: boolean },
 *  external: { visible: boolean, text: string }
 * }
 *
 * This change is introduced in version 3.6.0
 */
export function handleLegacyMessageConversion(payload: object): object | Partial<MessageState> {
  // if it is not a legacy message, we pass it as is
  if (!isLegacyMessageState(payload)) {
    return payload;
  }

  /**
   * The current migration only needs to handle the cases
   * for the deprecated external message controls
   */

  // Migrate external message
  // 2.1 the user gives us the text and a visible flag
  if (payload?.external?.text !== undefined && payload.external.visible !== undefined) {
    return {
      timer: { secondarySource: payload.external.visible ? 'external' : null },
      external: payload.external.text,
    } as Partial<MessageState>;
  }
  // 2.2 the user gives us the text
  else if (payload?.external?.text !== undefined) {
    return {
      external: payload.external.text,
    } as Partial<MessageState>;
  }
  // 2.3 the user gives us the visible flag
  else if (payload?.external?.visible !== undefined) {
    return {
      timer: { secondarySource: payload.external.visible ? 'external' : null },
    } as Partial<MessageState>;
  }

  // there should be no case for us to reach this since
  // the type guard would have ensured one of the above states
  return payload;
}
