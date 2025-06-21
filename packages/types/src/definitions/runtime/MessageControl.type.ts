export type SecondarySource = 'aux' | 'secondary' | null;

export type TimerMessage = {
  text: string;
  visible: boolean;
  blink: boolean;
  blackout: boolean;
  secondarySource: SecondarySource;
};

export type MessageState = {
  timer: TimerMessage;
  secondary: string;
};
