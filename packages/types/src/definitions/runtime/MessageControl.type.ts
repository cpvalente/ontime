export type SecondarySource = 'aux' | 'external' | null;

export type TimerMessage = {
  text: string;
  visible: boolean;
  blink: boolean;
  blackout: boolean;
  secondarySource: SecondarySource;
};

export type MessageState = {
  timer: TimerMessage;
  external: string;
};
