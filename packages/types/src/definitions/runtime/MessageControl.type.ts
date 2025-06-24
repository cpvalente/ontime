export type SecondarySource = 'aux1' | 'aux2' | 'aux3' | 'secondary' | null;

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
