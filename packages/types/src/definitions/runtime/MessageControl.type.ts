export type SecondarySource = 'aux1' | 'aux2' | 'aux3' | 'secondary' | null;

/**
 * Where the selected secondary source is displayed in the timer view
 * - below: shown as a smaller timer under the main timer (default)
 * - main: swapped into the main slot, demoting the event timer to the secondary slot
 */
export type SecondaryPlacement = 'below' | 'main';

export type TimerMessage = {
  text: string;
  visible: boolean;
  blink: boolean;
  blackout: boolean;
  secondarySource: SecondarySource;
  secondaryPlacement: SecondaryPlacement;
};

export type MessageState = {
  timer: TimerMessage;
  secondary: string;
};
