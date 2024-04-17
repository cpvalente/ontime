export type Message = {
  text: string;
  visible: boolean;
};

export type TimerMessage = Message & {
  blink: boolean;
  blackout: boolean;
};

export type MessageState = {
  timer: TimerMessage;
  lower: Message;
  external: Message;
};
