export type TimerMessage = {
  text: string;
  visible: boolean;
  blink: boolean;
  blackout: boolean;
  secondarySource: 'aux' | 'external' | null;
};

export type MessageState = {
  timer: TimerMessage;
  external: string;
};
