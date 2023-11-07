export type Message = {
  text: string;
  visible: boolean;
};

export type TimerMessage = Message & {
  timerBlink: boolean;
  timerBlackout: boolean;
};
