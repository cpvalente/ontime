export type SecondarySource = 'aux1' | 'aux2' | 'aux3' | 'secondary' | null;

export type TimerMessage = {
  text: string;
  visible: boolean;
  blink: boolean;
  blackout: boolean;
  secondarySource: SecondarySource;
  /** shows the secondary content in the main spot and the timer under it */
  swap: boolean;
};

export type MessageState = {
  timer: TimerMessage;
  secondary: string;
};
